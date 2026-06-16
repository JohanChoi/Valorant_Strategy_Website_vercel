import { NextResponse } from 'next/server';
import { cameraState, addLog, generateProtocolPayload } from '@/lib/camera';

// Keep custom presets in-memory (resets on server restart, but can be saved during session)
const presets: Record<string, { pan: number; tilt: number; zoom: number; name: string }> = {
  '1': { pan: 45, tilt: 10, zoom: 4, name: 'A-Site Entry' },
  '2': { pan: 220, tilt: -5, zoom: 2.5, name: 'B-Site Main' },
  '3': { pan: 135, tilt: 15, zoom: 3.5, name: 'Mid Double Doors' },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    // 1. Process local state update (Simulation Mode behavior)
    let details = '';
    
    if (action === 'move') {
      const dir = params?.direction || 'stop';
      const speed = params?.speed || 5;

      if (dir === 'up') {
        cameraState.tilt = Math.min(90, cameraState.tilt + speed);
        details = `Panned tilt UP by ${speed} deg. Current tilt: ${cameraState.tilt} deg`;
      } else if (dir === 'down') {
        cameraState.tilt = Math.max(-90, cameraState.tilt - speed);
        details = `Panned tilt DOWN by ${speed} deg. Current tilt: ${cameraState.tilt} deg`;
      } else if (dir === 'left') {
        cameraState.pan = (cameraState.pan - speed + 360) % 360;
        details = `Panned left by ${speed} deg. Current pan: ${cameraState.pan} deg`;
      } else if (dir === 'right') {
        cameraState.pan = (cameraState.pan + speed) % 360;
        details = `Panned right by ${speed} deg. Current pan: ${cameraState.pan} deg`;
      } else {
        details = `PTZ movement stopped.`;
      }
    } 
    
    else if (action === 'zoom') {
      const dir = params?.direction || 'stop';
      const zoomStep = 0.5;

      if (dir === 'in') {
        cameraState.zoom = Math.min(10, cameraState.zoom + zoomStep);
        details = `Zoomed IN to ${cameraState.zoom.toFixed(1)}x`;
      } else if (dir === 'out') {
        cameraState.zoom = Math.max(1, cameraState.zoom - zoomStep);
        details = `Zoomed OUT to ${cameraState.zoom.toFixed(1)}x`;
      } else {
        details = `Zoom adjustment stopped.`;
      }
    } 
    
    else if (action === 'preset') {
      const presetId = params?.presetId;
      const preset = presets[presetId];
      if (preset) {
        cameraState.pan = preset.pan;
        cameraState.tilt = preset.tilt;
        cameraState.zoom = preset.zoom;
        details = `Recalled preset ${presetId} ("${preset.name}"): Pan ${preset.pan} deg, Tilt ${preset.tilt} deg, Zoom ${preset.zoom}x`;
      } else {
        return NextResponse.json({ error: `Preset ${presetId} not found` }, { status: 404 });
      }
    } 
    
    else if (action === 'preset_save') {
      const presetId = params?.presetId;
      const name = params?.name || `Preset ${presetId}`;
      presets[presetId] = {
        pan: cameraState.pan,
        tilt: cameraState.tilt,
        zoom: cameraState.zoom,
        name: name,
      };
      details = `Saved preset ${presetId} ("${name}") at current coordinates: Pan ${cameraState.pan} deg, Tilt ${cameraState.tilt} deg, Zoom ${cameraState.zoom}x`;
    } 
    
    else if (action === 'toggle_ir') {
      cameraState.infrared = !!params?.value;
      details = `Infrared Night Vision toggled ${cameraState.infrared ? 'ON' : 'OFF'}`;
    } 
    
    else if (action === 'set_resolution') {
      cameraState.resolution = params?.value || '720p';
      details = `Camera feed resolution set to ${cameraState.resolution}`;
    } 
    
    else if (action === 'configure') {
      cameraState.isSimulation = !!params?.isSimulation;
      cameraState.ipAddress = params?.ipAddress || '192.168.2.101';
      cameraState.brand = params?.brand || 'simulator';
      cameraState.connectionStatus = cameraState.isSimulation ? 'connected' : 'connecting';
      details = `Reconfigured backend proxy. IP: ${cameraState.ipAddress}, Brand: ${cameraState.brand}, Simulation: ${cameraState.isSimulation}`;
    }

    // 2. Format protocol payload if proxying to a physical IP camera
    const proxyConfig = generateProtocolPayload(
      cameraState.isSimulation ? 'simulator' : cameraState.brand,
      cameraState.ipAddress,
      action,
      params || {}
    );

    // 3. If NOT in simulation mode, attempt to dispatch the command to the physical camera
    let status: 'Success' | 'Warning' | 'Error' = 'Success';
    let responseDetails = details;

    if (!cameraState.isSimulation && proxyConfig.protocol !== 'SIMULATOR') {
      try {
        // Prepare the actual proxy request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for camera ping

        const fetchOptions: RequestInit = {
          method: proxyConfig.protocol === 'ONVIF SOAP' ? 'POST' : 'GET',
          headers: proxyConfig.protocol === 'ONVIF SOAP' ? {
            'Content-Type': 'application/soap+xml; charset=utf-8',
          } : undefined,
          body: proxyConfig.protocol === 'ONVIF SOAP' ? proxyConfig.payload : undefined,
          signal: controller.signal
        };

        // Suppressed execution to prevent network crashes in sandboxed environment, but mocks request
        // In real execution: const res = await fetch(proxyConfig.url, fetchOptions);
        // We will simulate the network call and log it. If they have a real IP configured, we can do the call:
        if (cameraState.ipAddress && cameraState.ipAddress !== '192.168.2.101') {
          const res = await fetch(proxyConfig.url, fetchOptions);
          clearTimeout(timeoutId);
          if (res.ok) {
            cameraState.connectionStatus = 'connected';
            responseDetails = `[LIVE] ${details} (Forwarded to ${cameraState.brand.toUpperCase()} camera: ${proxyConfig.url})`;
          } else {
            throw new Error(`Camera returned HTTP status ${res.status}`);
          }
        } else {
          clearTimeout(timeoutId);
          // Standard simulated hardware success
          cameraState.connectionStatus = 'connected';
          responseDetails = `[MOCK PROXY] ${details} (Would forward to: ${proxyConfig.url})`;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown camera proxy error';
        status = 'Error';
        cameraState.connectionStatus = 'disconnected';
        responseDetails = `[PROXY ERROR] Failed to contact physical camera at ${proxyConfig.url}. Error: ${message}. Backend falling back to simulator state.`;
        addLog(
          action.toUpperCase(),
          proxyConfig.protocol,
          proxyConfig.payload,
          'Error',
          `Network fetch failed: ${message}`
        );
      }
    }

    // 4. Log the transaction to our live console
    if (status !== 'Error') {
      addLog(
        action.toUpperCase() + (params?.direction ? ` (${params.direction.toUpperCase()})` : ''),
        proxyConfig.protocol,
        proxyConfig.payload,
        status,
        responseDetails
      );
    }

    return NextResponse.json({
      success: true,
      state: cameraState,
      logDetails: responseDetails,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown API error';
    addLog('API_ERROR', 'SIMULATOR', 'N/A', 'Error', message);
    return NextResponse.json(
      { error: 'Failed to process camera command', details: message },
      { status: 500 }
    );
  }
}
