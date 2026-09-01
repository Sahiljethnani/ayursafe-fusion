import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { UploadCloud, FileText, X, Sparkles, CheckCircle2 } from "lucide-react";
import { setPendingFile, getSession } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Prescription — AyurSafe" },
      { name: "description", content: "Upload a prescription for AI-powered safety analysis." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getSession()) navigate({ to: "/" });
  }, [navigate]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setProgress(0);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  useEffect(() => {
    if (!file) return;
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          return 100;
        }
        return p + 6;
      });
    }, 90);
    return () => clearInterval(id);
  }, [file]);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("File is too large. Max size is 8MB.");
      return;
    }
    const ok =
      f.type.startsWith("image/") || f.type === "application/pdf" || /\.(png|jpg|jpeg|pdf)$/i.test(f.name);
    if (!ok) {
      toast.error("Unsupported file type. Use PNG, JPG, or PDF.");
      return;
    }
    setFile(f);
    toast.success("File added — ready for analysis.");
  };

  const handleAnalyze = () => {
    if (!file) return;
    setPendingFile({ file, name: file.name, size: file.size, type: file.type });
    navigate({ to: "/processing" });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="animate-fade-up mb-8">
        <span className="glass text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3 w-3" /> Step 1 of 2
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Upload prescription</h1>
        <p className="mt-1 text-muted-foreground">
          Add a clear photo or PDF of the prescription. We'll handle OCR and analysis.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onPick(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`glass transition-smooth group relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center sm:p-16 ${
          drag ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <div className="bg-gradient-primary shadow-glow mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
          <UploadCloud className="text-primary-foreground h-8 w-8" strokeWidth={2.2} />
        </div>
        <h3 className="text-lg font-semibold">Drag & drop your prescription</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          or <span className="text-primary font-medium">click to browse</span> · PNG, JPG, PDF up to 8MB
        </p>
      </div>

      {file && (
        <div className="glass shadow-card animate-scale-in mt-6 rounded-3xl p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="bg-muted flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
              {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <FileText className="text-muted-foreground h-8 w-8" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB · {file.type || "file"}
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="hover:bg-muted text-muted-foreground rounded-lg p-1.5"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-gradient-primary shadow-glow h-full rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {progress < 100 ? "Uploading…" : "Ready for analysis"}
                  </span>
                  <span className="font-semibold">
                    {progress < 100 ? `${progress}%` : (
                      <span className="text-safe inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            disabled={progress < 100}
            onClick={handleAnalyze}
            className="bg-gradient-primary text-primary-foreground shadow-elegant transition-smooth mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Analyze with AI
          </button>
        </div>
      )}
    </main>
  );
}
