import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  DragEvent,
} from "react";

import ReactMarkdown from "react-markdown";

import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  File,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const API_URL =
  "https://nexa-ai-1-rel1.onrender.com";


type DocumentItem = {
  id: string;
  filename: string;
  file_type: string;
  size: number;
  created_at: string;
  text_length?: number;
};


export default function Documents() {
  const { token } = useAuth();

  const [documents, setDocuments] =
    useState<DocumentItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [dragActive, setDragActive] =
    useState(false);

  const [analyzingId, setAnalyzingId] =
    useState<string | null>(null);

  const [analysis, setAnalysis] =
    useState<string | null>(null);

  const [analysisFilename, setAnalysisFilename] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);


  // =====================================================
  // Load Documents
  // =====================================================

  const loadDocuments = async () => {
    if (!token) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_URL}/api/documents/`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          "Failed to load documents."
        );
      }

      const data =
        await response.json();

      setDocuments(
        data.documents || []
      );

    } catch (error) {
      console.error(
        "Document loading error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load documents."
      );

    } finally {
      setIsLoading(false);
    }
  };


  // =====================================================
  // Initial Load
  // =====================================================

  useEffect(() => {
    if (token) {
      void loadDocuments();
    } else {
      setDocuments([]);
      setIsLoading(false);
    }
  }, [token]);


  // =====================================================
  // Format File Size
  // =====================================================

  const formatFileSize = (
    bytes: number
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };


  // =====================================================
  // Format Date
  // =====================================================

  const formatDate = (
    date: string
  ) => {
    return new Date(
      date
    ).toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };


  // =====================================================
  // Upload File
  // =====================================================

  const uploadFile = async (
    file: globalThis.File
  ) => {
    if (!token) {
      setErrorMessage(
        "Please log in before uploading a document."
      );
      return;
    }

    const allowedTypes = [
      ".pdf",
      ".txt",
      ".docx",
    ];

    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !allowedTypes.includes(
        extension
      )
    ) {
      setErrorMessage(
        "Unsupported file type. Please upload PDF, TXT, or DOCX."
      );

      return;
    }

    try {
      setIsUploading(true);
      setUploadMessage("");
      setErrorMessage("");

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          `${API_URL}/api/documents/upload`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          data.detail ||
            "Upload failed."
        );
      }

      setUploadMessage(
        `${file.name} uploaded successfully.`
      );

      await loadDocuments();

    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload document."
      );

    } finally {
      setIsUploading(false);
    }
  };


  // =====================================================
  // File Input
  // =====================================================

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      void uploadFile(file);
    }

    event.target.value = "";
  };


  // =====================================================
  // Drag and Drop
  // =====================================================

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragActive(true);
  };


  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragActive(false);
  };


  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      void uploadFile(file);
    }
  };


  // =====================================================
  // Analyze Document
  // =====================================================

  const analyzeDocument = async (
    document: DocumentItem
  ) => {
    if (!token) {
      setErrorMessage(
        "Please log in before analyzing a document."
      );
      return;
    }

    try {
      setAnalyzingId(
        document.id
      );

      setErrorMessage("");
      setUploadMessage("");

      const response =
        await fetch(
          `${API_URL}/api/documents/${document.id}/analyze`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have access to this document."
          );
        }

        throw new Error(
          data.detail ||
            "Failed to analyze document."
        );
      }

      setAnalysis(
        data.analysis
      );

      setAnalysisFilename(
        data.filename
      );

    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to analyze document."
      );

    } finally {
      setAnalyzingId(null);
    }
  };


  // =====================================================
  // Delete Document
  // =====================================================

  const deleteDocument = async (
    documentId: string
  ) => {
    if (!token) {
      setErrorMessage(
        "Please log in before deleting a document."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this document?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const response =
        await fetch(
          `${API_URL}/api/documents/${documentId}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have access to this document."
          );
        }

        throw new Error(
          data.detail ||
            "Failed to delete document."
        );
      }

      setDocuments(
        (current) =>
          current.filter(
            (document) =>
              document.id !==
              documentId
          )
      );

      if (
        analysisFilename ===
        documents.find(
          (document) =>
            document.id ===
            documentId
        )?.filename
      ) {
        setAnalysis(null);
        setAnalysisFilename("");
      }

    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete document."
      );
    }
  };


  // =====================================================
  // File Icon
  // =====================================================

  const getFileIcon = (
    fileType: string
  ) => {
    if (
      fileType === "PDF"
    ) {
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
          <FileText
            size={22}
            className="text-red-500"
          />
        </div>
      );
    }

    if (
      fileType === "DOCX"
    ) {
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
          <FileText
            size={22}
            className="text-blue-500"
          />
        </div>
      );
    }

    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
        <File
          size={22}
          className="text-slate-500"
        />
      </div>
    );
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          Header
      ================================================= */}

      <div>
        <h1 className="text-3xl font-bold text-slate-950">
          Documents
        </h1>

        <p className="mt-2 text-slate-500">
          Upload and analyze your documents
          with local AI.
        </p>
      </div>


      {/* =================================================
          Upload Area
      ================================================= */}

      <div
        onDragOver={
          handleDragOver
        }
        onDragLeave={
          handleDragLeave
        }
        onDrop={
          handleDrop
        }
        className={`rounded-2xl border-2 border-dashed p-8 transition ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-200 bg-white hover:border-indigo-300"
        }`}
      >

        <div className="flex flex-col items-center justify-center text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">

            {isUploading ? (
              <Loader2
                size={30}
                className="animate-spin text-indigo-600"
              />
            ) : (
              <CloudUpload
                size={30}
                className="text-indigo-600"
              />
            )}

          </div>


          <h2 className="mt-5 text-lg font-semibold text-slate-900">

            {isUploading
              ? "Uploading document..."
              : "Upload a document"}

          </h2>


          <p className="mt-2 text-sm text-slate-500">
            Drag and drop your file here,
            or choose a file from your computer.
          </p>


          <p className="mt-2 text-xs text-slate-400">
            Supported formats: PDF, DOCX, TXT
          </p>


          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              isUploading
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <Upload size={17} />

            {isUploading
              ? "Uploading..."
              : "Choose File"}

          </button>


          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={
              handleFileChange
            }
            className="hidden"
          />

        </div>

      </div>


      {/* =================================================
          Success
      ================================================= */}

      {uploadMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

          <CheckCircle2
            size={18}
          />

          <span>
            {uploadMessage}
          </span>

        </div>
      )}


      {/* =================================================
          Error
      ================================================= */}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle
            size={18}
          />

          <span>
            {errorMessage}
          </span>

        </div>
      )}


      {/* =================================================
          Documents
      ================================================= */}

      <div>

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-slate-900">
            Your Documents
          </h2>

          <p className="mt-1 text-sm text-slate-500">

            {documents.length}{" "}

            {documents.length === 1
              ? "document"
              : "documents"}{" "}

            uploaded

          </p>

        </div>


        {/* Loading */}

        {isLoading && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">

            <div className="flex items-center gap-3 text-sm text-slate-500">

              <Loader2
                size={20}
                className="animate-spin"
              />

              Loading documents...

            </div>

          </div>
        )}


        {/* Empty */}

        {!isLoading &&
          documents.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">

                <FileText
                  size={25}
                  className="text-slate-400"
                />

              </div>


              <h3 className="mt-4 font-semibold text-slate-900">
                No documents yet
              </h3>


              <p className="mt-2 text-sm text-slate-500">
                Upload your first document
                to start working with NexaAI.
              </p>

            </div>
          )}


        {/* Document List */}

        {!isLoading &&
          documents.length > 0 && (
            <div className="space-y-3">

              {documents.map(
                (document) => (
                  <div
                    key={
                      document.id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex min-w-0 items-center gap-4">

                        {getFileIcon(
                          document.file_type
                        )}


                        <div className="min-w-0">

                          <h3 className="truncate font-medium text-slate-900">
                            {document.filename}
                          </h3>


                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                            <span>
                              {document.file_type}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {formatFileSize(
                                document.size
                              )}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {formatDate(
                                document.created_at
                              )}
                            </span>

                          </div>

                        </div>

                      </div>


                      <div className="ml-4 flex shrink-0 items-center gap-2">

                        {/* Analyze */}

                        <button
                          type="button"
                          onClick={() =>
                            void analyzeDocument(
                              document
                            )
                          }
                          disabled={
                            analyzingId ===
                            document.id
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {analyzingId ===
                          document.id ? (
                            <>
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />

                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles
                                size={15}
                              />

                              Analyze with AI
                            </>
                          )}

                        </button>


                        {/* Delete */}

                        <button
                          type="button"
                          onClick={() =>
                            void deleteDocument(
                              document.id
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete document"
                        >

                          <Trash2
                            size={18}
                          />

                        </button>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

      </div>


      {/* =================================================
          AI Analysis Result
      ================================================= */}

      {analysis && (
        <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">

                <Sparkles
                  size={20}
                  className="text-indigo-600"
                />

              </div>


              <div>

                <h2 className="font-semibold text-slate-900">
                  AI Analysis
                </h2>

                <p className="text-xs text-slate-500">
                  {analysisFilename}
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={() => {
                setAnalysis(null);
                setAnalysisFilename("");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Close analysis"
            >

              <X size={18} />

            </button>

          </div>


          <div className="px-6 py-6">

            <div className="prose prose-slate max-w-none text-sm leading-7">

              <ReactMarkdown>
                {analysis}
              </ReactMarkdown>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}