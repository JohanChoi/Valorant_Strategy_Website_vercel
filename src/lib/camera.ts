export interface CameraState {
  pan: number; // 0 to 360
  tilt: number; // -90 to 90
  zoom: number; // 1 to 10
  infrared: boolean;
  resolution: string;
  isSimulation: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  ipAddress: string;
  brand: 'dahua' | 'hikvision' | 'onvif' | 'simulator';
}

export interface CameraCommandLog {
  timestamp: string;
  action: string;
  protocol: 'HTTP CGI' | 'ONVIF SOAP' | 'SIMULATOR';
  requestPayload: string;
  status: 'Success' | 'Warning' | 'Error';
  details: string;
}

type CameraProtocolParams = Record<string, string | number | boolean | undefined>;

const paramString = (value: CameraProtocolParams[string], fallback = '') => {
  return value === undefined ? fallback : String(value);
};

const paramNumber = (value: CameraProtocolParams[string], fallback: number) => {
  return typeof value === 'number' ? value : Number(value || fallback);
};

const globalForCamera = global as unknown as {
  cameraState: CameraState;
  commandLogs: CameraCommandLog[];
};

if (!globalForCamera.cameraState) {
  globalForCamera.cameraState = {
    pan: 180,
    tilt: 0,
    zoom: 2.5,
    infrared: false,
    resolution: '720p',
    isSimulation: true,
    connectionStatus: 'connected',
    ipAddress: '192.168.2.101',
    brand: 'simulator',
  };
}

if (!globalForCamera.commandLogs) {
  globalForCamera.commandLogs = [
    {
      timestamp: new Date().toISOString(),
      action: 'System Boot',
      protocol: 'SIMULATOR',
      requestPayload: 'N/A',
      status: 'Success',
      details: 'Camera simulator online. Ready to accept backend proxy connections.',
    },
  ];
}

export const cameraState = globalForCamera.cameraState;
export const commandLogs = globalForCamera.commandLogs;

export function addLog(
  action: string,
  protocol: 'HTTP CGI' | 'ONVIF SOAP' | 'SIMULATOR',
  requestPayload: string,
  status: 'Success' | 'Warning' | 'Error',
  details: string
) {
  commandLogs.unshift({
    timestamp: new Date().toISOString(),
    action,
    protocol,
    requestPayload,
    status,
    details,
  });

  // Cap logs to 50
  if (commandLogs.length > 50) {
    commandLogs.pop();
  }
}

// Generate the raw protocol payloads for physical IP cameras
export function generateProtocolPayload(
  brand: string,
  ip: string,
  action: string,
  params: CameraProtocolParams
): { url: string; payload: string; protocol: 'HTTP CGI' | 'ONVIF SOAP' | 'SIMULATOR' } {
  const cleanIp = ip || '192.168.2.101';

  if (brand === 'dahua') {
    let query = '';
    if (action === 'move') {
      const dir = paramString(params.direction, 'stop');
      const code = dir.charAt(0).toUpperCase() + dir.slice(1);
      const act = dir === 'stop' ? 'stop' : 'start';
      query = `/cgi-bin/ptz.cgi?action=${act}&channel=1&code=${code}&arg1=0&arg2=${paramNumber(params.speed, 5)}&arg3=0`;
    } else if (action === 'zoom') {
      const code = params.direction === 'in' ? 'ZoomWide' : 'ZoomTele'; // Dahua uses specific terms or ZoomIn/ZoomOut
      const act = params.direction === 'stop' ? 'stop' : 'start';
      query = `/cgi-bin/ptz.cgi?action=${act}&channel=1&code=${code}&arg1=0&arg2=${paramNumber(params.speed, 5)}&arg3=0`;
    } else if (action === 'preset') {
      query = `/cgi-bin/ptz.cgi?action=bypass&channel=1&code=GotoPreset&arg1=0&arg2=${paramString(params.presetId)}&arg3=0`;
    } else if (action === 'preset_save') {
      query = `/cgi-bin/ptz.cgi?action=bypass&channel=1&code=SetPreset&arg1=0&arg2=${paramString(params.presetId)}&arg3=0`;
    } else if (action === 'toggle_ir') {
      query = `/cgi-bin/configManager.cgi?action=setConfig&DayNightColor=${params.value ? 'Night' : 'Auto'}`;
    }

    return {
      url: `http://${cleanIp}${query}`,
      payload: 'GET Request',
      protocol: 'HTTP CGI',
    };
  }

  if (brand === 'hikvision') {
    let path = '';
    let xml = '';

    if (action === 'move') {
      path = `/ISAPI/PTZCtrl/channels/1/continuous`;
      const dir = paramString(params.direction, 'stop');
      let pan = 0;
      let tilt = 0;
      const speed = paramNumber(params.speed, 5);

      if (dir === 'up') tilt = speed;
      else if (dir === 'down') tilt = -speed;
      else if (dir === 'left') pan = -speed;
      else if (dir === 'right') pan = speed;

      xml = `<?xml version="1.0" encoding="UTF-8"?>
<PTZData>
  <pan>${pan}</pan>
  <tilt>${tilt}</tilt>
</PTZData>`;
    } else if (action === 'zoom') {
      path = `/ISAPI/PTZCtrl/channels/1/continuous`;
      const speed = params.direction === 'in' ? paramNumber(params.speed, 5) : -paramNumber(params.speed, 5);
      const finalSpeed = params.direction === 'stop' ? 0 : speed;

      xml = `<?xml version="1.0" encoding="UTF-8"?>
<PTZData>
  <zoom>${finalSpeed}</zoom>
</PTZData>`;
    } else if (action === 'preset') {
      path = `/ISAPI/PTZCtrl/channels/1/presets/${paramString(params.presetId)}/goto`;
      xml = 'N/A (GET/PUT action trigger)';
    } else if (action === 'preset_save') {
      path = `/ISAPI/PTZCtrl/channels/1/presets/${paramString(params.presetId)}`;
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<PTZPreset>
  <id>${paramString(params.presetId)}</id>
  <presetName>${paramString(params.name, `Preset ${paramString(params.presetId)}`)}</presetName>
</PTZPreset>`;
    } else if (action === 'toggle_ir') {
      path = `/ISAPI/Image/channels/1/ircutFilter`;
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<IrcutFilter>
  <ircutFilterType>${params.value ? 'night' : 'auto'}</ircutFilterType>
</IrcutFilter>`;
    }

    return {
      url: `http://${cleanIp}${path}`,
      payload: xml,
      protocol: 'HTTP CGI',
    };
  }

  if (brand === 'onvif') {
    let soapBody = '';

    if (action === 'move') {
      const dir = paramString(params.direction, 'stop');
      const speed = paramNumber(params.speed, 5) / 10; // ONVIF velocities are normally -1.0 to 1.0
      let x = 0;
      let y = 0;

      if (dir === 'left') x = -speed;
      else if (dir === 'right') x = speed;
      else if (dir === 'up') y = speed;
      else if (dir === 'down') y = -speed;

      if (dir === 'stop') {
        soapBody = `<tptz:Stop>
  <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
  <tptz:PanTilt>true</tptz:PanTilt>
  <tptz:Zoom>true</tptz:Zoom>
</tptz:Stop>`;
      } else {
        soapBody = `<tptz:ContinuousMove>
  <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
  <tptz:Velocity>
    <tt:PanTilt x="${x.toFixed(1)}" y="${y.toFixed(1)}" xmlns:tt="http://www.onvif.org/ver10/schema"/>
  </tptz:Velocity>
</tptz:ContinuousMove>`;
      }
    } else if (action === 'zoom') {
      const dir = paramString(params.direction, 'stop');
      const speed = paramNumber(params.speed, 5) / 10;
      const z = dir === 'in' ? speed : -speed;

      if (dir === 'stop') {
        soapBody = `<tptz:Stop>
  <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
  <tptz:Zoom>true</tptz:Zoom>
</tptz:Stop>`;
      } else {
        soapBody = `<tptz:ContinuousMove>
  <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
  <tptz:Velocity>
    <tt:Zoom x="${z.toFixed(1)}" xmlns:tt="http://www.onvif.org/ver10/schema"/>
  </tptz:Velocity>
</tptz:ContinuousMove>`;
      }
    } else if (action === 'preset') {
      soapBody = `<tptz:GotoPreset>
  <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
  <tptz:PresetToken>${paramString(params.presetId)}</tptz:PresetToken>
</tptz:GotoPreset>`;
    } else if (action === 'preset_save') {
      soapBody = `<tptz:SetPreset>
  <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
  <tptz:PresetName>${paramString(params.name, `Preset_${paramString(params.presetId)}`)}</tptz:PresetName>
  <tptz:PresetToken>${paramString(params.presetId)}</tptz:PresetToken>
</tptz:SetPreset>`;
    } else if (action === 'toggle_ir') {
      soapBody = `<timg:SetImagingSettings xmlns:timg="http://www.onvif.org/ver20/imaging/wsdl">
  <timg:VideoSourceToken>VideoSource_1</timg:VideoSourceToken>
  <timg:ImagingSettings>
    <tt:IrCutFilter>${params.value ? 'ON' : 'AUTO'}</tt:IrCutFilter>
  </timg:ImagingSettings>
</timg:SetImagingSettings>`;
    }

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" 
               xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
  <soap:Body>
    ${soapBody}
  </soap:Body>
</soap:Envelope>`;

    return {
      url: `http://${cleanIp}/onvif/device_service`,
      payload: soapEnvelope,
      protocol: 'ONVIF SOAP',
    };
  }

  // Default to Simulator
  return {
    url: 'internal://simulator-loopback',
    payload: JSON.stringify({ action, params }),
    protocol: 'SIMULATOR',
  };
}
