import { type FormEvent, useEffect, useRef, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import {
  downloadDocument,
  listDocuments,
  previewDocument,
  uploadDocument,
  type ChurchDocument,
} from './documents.api';

const pageSize = 10;
const maxFileSizeBytes = 10 * 1024 * 1024;

const categories = [
  { value: '', label: 'Toutes categories' },
  { value: 'GENERAL', label: 'General' },
  { value: 'LETTER', label: 'Courrier / Lettre' },
  { value: 'MINUTES', label: 'Proces-verbal' },
  { value: 'REPORT', label: 'Rapport' },
  { value: 'PERMISSION', label: 'Autorisation' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'OTHER', label: 'Autre' },
];

const inputClass = 'h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]';

function formatDate(value?: string | null) {
  if (!value) return '-';

  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-');

  if (!year || !month || !day) return dateOnly;

  return `${day}/${month}/${year}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCategoryLabel(value: string) {
  return categories.find((category) => category.value === value)?.label ?? value;
}

function canPreviewDocument(document: ChurchDocument) {
  return document.mimeType === 'application/pdf'
    || document.mimeType.startsWith('image/')
    || document.mimeType.startsWith('text/');
}

function buildDownloadFileName(document: ChurchDocument) {
  return document.originalFileName || document.title;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [documents, setDocuments] = useState<ChurchDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ChurchDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadDocuments() {
        try {
          setIsLoading(true);
          setMessage('');

          const response = await listDocuments({
            search: searchTerm.trim() || undefined,
            category: categoryFilter || undefined,
            page,
            limit: pageSize,
          });

          setDocuments(response.data);
          setPagination({
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          });
          setSelectedDocument((current) => {
            if (current && response.data.some((document) => document.id === current.id)) return current;
            return response.data[0] ?? null;
          });
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Impossible de charger les documents.');
          setDocuments([]);
          setSelectedDocument(null);
          setPagination({ total: 0, totalPages: 1 });
        } finally {
          setIsLoading(false);
        }
      }

      loadDocuments();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [categoryFilter, page, refreshKey, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);

    if (file && !title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const resetUploadForm = () => {
    setTitle('');
    setCategory('GENERAL');
    setDescription('');
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setMessage('Selectionnez un fichier a televerser.');
      return;
    }

    if (selectedFile.size > maxFileSizeBytes) {
      setMessage('Le fichier est trop grand. Taille maximale: 10 MB.');
      return;
    }

    if (!title.trim()) {
      setMessage('Ajoutez un titre pour ce document.');
      return;
    }

    try {
      setIsUploading(true);
      setMessage('');
      setSuccessMessage('');

      const response = await uploadDocument({
        file: selectedFile,
        title: title.trim(),
        category,
        description: description.trim() || undefined,
      });

      resetUploadForm();
      setPage(1);
      setRefreshKey((current) => current + 1);
      setSelectedDocument(response.data);
      setSuccessMessage('Document televerse avec succes.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de televerser le document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreview = async (document: ChurchDocument) => {
    if (!canPreviewDocument(document)) {
      setMessage('Apercu non disponible pour ce type de fichier. Utilisez Telecharger.');
      return;
    }

    try {
      setMessage('');
      const blob = await previewDocument(document.id);

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setPreviewUrl(URL.createObjectURL(blob));
      setSelectedDocument(document);
      setIsPreviewOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible d ouvrir l apercu du document.');
    }
  };

  const handleDownload = async (document: ChurchDocument) => {
    try {
      setMessage('');
      const blob = await downloadDocument(document.id);
      downloadBlob(blob, buildDownloadFileName(document));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de telecharger le document.');
    }
  };

  const handlePrintPreview = () => {
    previewFrameRef.current?.contentWindow?.focus();
    previewFrameRef.current?.contentWindow?.print();
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
              <CatholicIcon name="document" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Archives paroissiales</p>
              <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Documents</h2>
              <p className="text-[#667085]">Televerser, consulter, imprimer et telecharger les documents importants de la paroisse.</p>
            </div>
          </div>

          {isLoading && <span className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#667085]">Chargement...</span>}
        </div>
      </section>

      {message && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{message}</p>
          <button type="button" onClick={() => setMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      {successMessage && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{successMessage}</p>
          <button type="button" onClick={() => setSuccessMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleUpload} className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Nouveau document</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Televerser un fichier</h3>
            <p className="mt-1 text-sm font-semibold text-[#667085]">PDF, images, fichiers texte, Word ou autres documents importants.</p>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Fichier</span>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#344054] file:mr-4 file:rounded-lg file:border-0 file:bg-[#0F3D2E] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white"
              />
            </label>

            {selectedFile && (
              <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-3 text-sm font-semibold text-[#667085]">
                {selectedFile.name} | {formatSize(selectedFile.size)}
              </div>
            )}

            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Titre</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Lettre de nomination"
                className={`${inputClass} mt-2 w-full`}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Categorie</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={`${inputClass} mt-2 w-full`}>
                {categories.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-[#344054]">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Courte note sur le document"
                rows={4}
                className="mt-2 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]"
              />
            </label>

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CatholicIcon name="plus" className="h-5 w-5" />
              {isUploading ? 'Televersement...' : 'Televerser document'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="sticky top-0 z-20 grid gap-3 rounded-2xl border border-[#E5DED0] bg-white/95 p-4 shadow-sm backdrop-blur lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
              <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
              <input
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Rechercher titre, fichier ou description"
                className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
              />
            </label>
            <select value={categoryFilter} onChange={(event) => handleCategoryFilterChange(event.target.value)} className={inputClass}>
              {categories.map((item) => (
                <option key={item.value || 'ALL'} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E5DED0] bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                <tr>
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3">Categorie</th>
                  <th className="px-4 py-3">Fichier</th>
                  <th className="px-4 py-3">Taille</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6D6]">
                {documents.map((document) => {
                  const isSelected = selectedDocument?.id === document.id;

                  return (
                    <tr
                      key={document.id}
                      onClick={() => setSelectedDocument(document)}
                      className={`cursor-pointer transition ${isSelected ? 'bg-[#F4E8C8]' : 'bg-white hover:bg-[#FFF9EE]'}`}
                    >
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">
                        {document.title}
                        {document.description && <span className="block text-xs font-semibold text-[#667085]">{document.description}</span>}
                      </td>
                      <td className="px-4 py-3 text-[#667085]">{getCategoryLabel(document.category)}</td>
                      <td className="px-4 py-3 text-[#667085]">{document.originalFileName}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatSize(document.sizeBytes)}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(document.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); handlePreview(document); }}
                            disabled={!canPreviewDocument(document)}
                            className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-xs font-bold text-[#0F3D2E] hover:bg-[#FFF9EE] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Apercu
                          </button>
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); handleDownload(document); }}
                            className="rounded-lg bg-[#0F3D2E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#145C43]"
                          >
                            Telecharger
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!isLoading && documents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun document trouve.</td>
                  </tr>
                )}

                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Chargement des documents...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[#667085]">Total: {pagination.total} document{pagination.total > 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-sm font-bold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedent
              </button>
              <span className="text-sm font-bold text-[#0F3D2E]">Page {page} / {pagination.totalPages}</span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-sm font-bold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </section>

      {isPreviewOpen && selectedDocument && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#D8C8A2] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Apercu document</p>
                <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">{selectedDocument.title}</h3>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handlePrintPreview} className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Imprimer</button>
                <button type="button" onClick={() => handleDownload(selectedDocument)} className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Telecharger</button>
                <button type="button" onClick={closePreview} className="rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white hover:bg-[#145C43]">Fermer</button>
              </div>
            </div>
            <iframe ref={previewFrameRef} title="Apercu document" src={previewUrl} className="h-full w-full bg-[#EFE7D6]" />
          </div>
        </div>
      )}
    </div>
  );
}
