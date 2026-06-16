'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAPS } from '@/lib/maps';

interface FilePreview {
  name: string;
  type: string;
  url: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mapName, setMapName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSites = mapName ? (MAPS[mapName] || []) : [];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.url));
      return selectedFiles.map((selectedFile) => ({
        name: selectedFile.name,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile),
      }));
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('mapName', mapName);
    formData.append('siteName', siteName);
    files.forEach((file) => formData.append('files', file));

    try {
      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        return;
      }

      router.push(`/post/${data.post.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center" style={{ paddingBottom: '3rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 className="text-center mb-8" style={{ fontSize: '1.6rem' }}>
          <span className="text-red">{'//'}</span> Upload Strategy
        </h2>

        {error && (
          <div className="error-banner mb-4">{error}</div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              placeholder="e.g. A Site Sova Dart Lineup"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              placeholder="Describe the strategy, lineup, or setup..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-4 edit-post-selects">
            <div className="flex-1">
              <label className="form-label">Map</label>
              <select
                required
                value={mapName}
                onChange={(e) => {
                  setMapName(e.target.value);
                  setSiteName('');
                }}
              >
                <option value="">Select Map</option>
                {Object.keys(MAPS).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="form-label">Site</label>
              <select
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                disabled={!mapName}
              >
                <option value="">Select Site</option>
                {availableSites.map((s) => (
                  <option key={s} value={s}>Site {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Images or Videos</label>
            <div
              className="file-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              {previews.length > 0 ? (
                <div className="upload-preview-grid">
                  {previews.map((preview) => (
                    <div className="upload-preview-item" key={`${preview.name}-${preview.url}`}>
                      {preview.type.startsWith('video/') ? (
                        <video src={preview.url} controls />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview.url} alt={preview.name} />
                      )}
                      <span>{preview.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="file-drop-text">
                  <span style={{ fontSize: '2rem' }}>File</span>
                  <p>Click to select images or videos</p>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>PNG, JPG, GIF, MP4, WEBM</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <button type="submit" className="mt-4" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Strategy'}
          </button>
        </form>
      </div>
    </div>
  );
}
