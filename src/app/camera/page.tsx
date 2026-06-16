'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Camera, Play, RotateCw, Settings, Square, WifiOff } from 'lucide-react';

const DEFAULT_CAMERA_IP = '192.168.2.101';
const DEFAULT_STREAM_PATH = '/stream';

const getSavedSetting = (key: string, fallback: string) => {
  return localStorage.getItem(key) || fallback;
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  font: '14px system-ui, sans-serif',
};

const buttonStyle: React.CSSProperties = {
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  cursor: 'pointer',
  font: '600 14px system-ui, sans-serif',
  letterSpacing: 0,
  textTransform: 'none',
  boxShadow: 'none',
  transform: 'none',
  minHeight: '40px',
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#0f172a',
  borderColor: '#0f172a',
  color: '#fff',
};

const normalizePath = (path: string) => {
  if (!path.trim()) return DEFAULT_STREAM_PATH;
  if (/^https?:\/\//i.test(path.trim())) return path.trim();
  return path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`;
};

function CameraDashboard() {
  const [cameraIp, setCameraIp] = useState(DEFAULT_CAMERA_IP);
  const [streamPath, setStreamPath] = useState(DEFAULT_STREAM_PATH);
  const [cameraUser, setCameraUser] = useState('');
  const [cameraPass, setCameraPass] = useState('');
  const [embedAuth, setEmbedAuth] = useState(false);
  const [displayMode, setDisplayMode] = useState<'image' | 'page'>('image');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamVersion, setStreamVersion] = useState(0);
  const [failedStreamUrl, setFailedStreamUrl] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    const savedDisplayMode = getSavedSetting('cam_display_mode', 'image');

    // Loading saved browser-only settings after hydration keeps SSR and client text identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCameraIp(getSavedSetting('cam_ip', DEFAULT_CAMERA_IP));
    setStreamPath(getSavedSetting('cam_stream_path', DEFAULT_STREAM_PATH));
    setCameraUser(getSavedSetting('cam_user', ''));
    setCameraPass(getSavedSetting('cam_pass', ''));
    setEmbedAuth(getSavedSetting('cam_embed_auth', 'false') === 'true');
    setDisplayMode(savedDisplayMode === 'page' ? 'page' : 'image');
  }, []);

  const streamUrl = useMemo(() => {
    const normalizedPath = normalizePath(streamPath);

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    const host = embedAuth && cameraUser && cameraPass
      ? `${encodeURIComponent(cameraUser)}:${encodeURIComponent(cameraPass)}@${cameraIp}`
      : cameraIp;

    return `http://${host}${normalizedPath}`;
  }, [cameraIp, cameraPass, cameraUser, embedAuth, streamPath]);

  const streamError = isStreaming && failedStreamUrl === streamUrl;

  const saveSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const startStream = () => {
    setFailedStreamUrl(null);
    setStreamVersion((value) => value + 1);
    setIsStreaming(true);
  };

  const stopStream = () => {
    setIsStreaming(false);
    setFailedStreamUrl(null);
  };

  const quickStreams: Array<{ label: string; value: string; mode?: 'image' | 'page' }> = [
    { label: 'Camera page', value: `http://${cameraIp}`, mode: 'page' },
    { label: 'OV2640 / ESP32 stream', value: `http://${cameraIp}:81/stream`, mode: 'image' },
    { label: '/stream', value: '/stream', mode: 'image' },
    { label: '/video', value: '/video', mode: 'image' },
    { label: '/video.mjpg', value: '/video.mjpg', mode: 'image' },
    { label: '/cam.mjpeg', value: '/cam.mjpeg', mode: 'image' },
    { label: '/mjpeg/1', value: '/mjpeg/1', mode: 'image' },
  ];

  return (
    <div style={{ color: '#0f172a', fontFamily: 'system-ui, sans-serif', letterSpacing: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Camera size={24} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>Camera Stream</div>
        </div>
        <div style={{ color: streamError ? '#b91c1c' : isStreaming ? '#166534' : '#475569', fontSize: '14px', fontWeight: 600 }}>
          {streamError ? 'Stream unavailable' : isStreaming ? 'Streaming' : 'Stopped'}
        </div>
      </div>

      <section style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', background: '#f8fafc', marginBottom: '18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Camera IP Address
            <input
              type="text"
              value={cameraIp}
              onChange={(event) => {
                setCameraIp(event.target.value);
                setFailedStreamUrl(null);
                saveSetting('cam_ip', event.target.value);
              }}
              placeholder="192.168.2.101"
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
            Stream Path or Full URL
            <input
              type="text"
              value={streamPath}
              onChange={(event) => {
                setStreamPath(event.target.value);
                setFailedStreamUrl(null);
                saveSetting('cam_stream_path', event.target.value);
              }}
              placeholder="/stream"
              style={fieldStyle}
            />
          </label>

          <button
            onClick={() => setShowAdvancedSettings((value) => !value)}
            style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => {
              setDisplayMode('image');
              saveSetting('cam_display_mode', 'image');
              setFailedStreamUrl(null);
            }}
            style={{ ...(displayMode === 'image' ? primaryButtonStyle : buttonStyle), minHeight: '34px', fontSize: '13px' }}
          >
            MJPEG image stream
          </button>
          <button
            onClick={() => {
              setDisplayMode('page');
              saveSetting('cam_display_mode', 'page');
              setFailedStreamUrl(null);
            }}
            style={{ ...(displayMode === 'page' ? primaryButtonStyle : buttonStyle), minHeight: '34px', fontSize: '13px' }}
          >
            Embedded camera page
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {quickStreams.map((stream) => (
            <button
              key={stream.label}
              onClick={() => {
                setStreamPath(stream.value);
                if (stream.mode) {
                  setDisplayMode(stream.mode);
                  saveSetting('cam_display_mode', stream.mode);
                }
                setFailedStreamUrl(null);
                saveSetting('cam_stream_path', stream.value);
              }}
              style={{ ...buttonStyle, minHeight: '32px', padding: '6px 10px', fontSize: '13px' }}
            >
              {stream.label}
            </button>
          ))}
        </div>

        {showAdvancedSettings && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Username
                <input
                  type="text"
                  value={cameraUser}
                  onChange={(event) => {
                    setCameraUser(event.target.value);
                    setFailedStreamUrl(null);
                    saveSetting('cam_user', event.target.value);
                  }}
                  style={fieldStyle}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                Password
                <input
                  type="password"
                  value={cameraPass}
                  onChange={(event) => {
                    setCameraPass(event.target.value);
                    setFailedStreamUrl(null);
                    saveSetting('cam_pass', event.target.value);
                  }}
                  style={fieldStyle}
                />
              </label>
            </div>

            <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={embedAuth}
                onChange={(event) => {
                  setEmbedAuth(event.target.checked);
                  setFailedStreamUrl(null);
                  localStorage.setItem('cam_embed_auth', String(event.target.checked));
                }}
                style={{ width: '16px' }}
              />
              Embed username and password in the stream URL
            </label>
          </div>
        )}

      </section>

      <section style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#020617', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
        {!isStreaming ? (
          <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '24px', display: 'grid', gap: '8px', justifyItems: 'center' }}>
            <Camera size={36} />
            <div style={{ color: '#fff', fontWeight: 700 }}>Stream stopped</div>
            <div style={{ maxWidth: '560px', fontSize: '13px', lineHeight: 1.5 }}>
              Press Start Stream to load {streamUrl}.
            </div>
          </div>
        ) : streamError ? (
          <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '24px', display: 'grid', gap: '8px', justifyItems: 'center' }}>
            <WifiOff size={36} />
            <div style={{ color: '#fff', fontWeight: 700 }}>Camera stream could not load</div>
            <div style={{ maxWidth: '620px', fontSize: '13px', lineHeight: 1.5 }}>
              Tried {streamUrl}. If the camera page opens in a browser but this does not, use the exact image stream endpoint, not the camera control page URL.
            </div>
          </div>
        ) : (
          <>
            {displayMode === 'page' ? (
              <iframe
                key={`${streamUrl}-${streamVersion}-page`}
                src={streamUrl}
                title="Camera page"
                onError={() => setFailedStreamUrl(streamUrl)}
                style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#fff' }}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- Direct MJPEG/IP camera streams should not pass through Next image optimization. */}
                <img
                  key={`${streamUrl}-${streamVersion}-image`}
                  src={streamUrl}
                  alt="Camera stream"
                  onError={() => setFailedStreamUrl(streamUrl)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </>
            )}
          </>
        )}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        <button onClick={startStream} style={{ ...primaryButtonStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Play size={16} />
          Start Stream
        </button>
        <button onClick={stopStream} style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Square size={16} />
          Stop Stream
        </button>
        <button onClick={startStream} style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <RotateCw size={16} />
          Reload Stream
        </button>
      </section>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#f8fafc', color: '#334155', font: '12px ui-monospace, SFMono-Regular, Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Stream URL: {streamUrl} | Mode: {displayMode === 'page' ? 'embedded camera page' : 'MJPEG image'}
      </div>
    </div>
  );
}

export default function CameraPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading camera stream...</div>}>
      <CameraDashboard />
    </Suspense>
  );
}
