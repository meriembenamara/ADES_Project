import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function PdfLabelingViewer({ fileData, selectionMode, onAttributeSelect, onValueSelect }) {
  const viewerRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(720);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const node = viewerRef.current;

    if (!node) {
      return undefined;
    }

    const updateWidth = () => {
      setPageWidth(Math.max(320, Math.floor(node.clientWidth - 24)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? "";

    if (!selectedText || !viewerRef.current) {
      return;
    }

    const anchorNode = selection?.anchorNode;

    if (!anchorNode || !viewerRef.current.contains(anchorNode)) {
      return;
    }

    if (selectionMode === "attribute") {
      onAttributeSelect(selectedText);
    } else {
      onValueSelect(selectedText);
    }

    selection?.removeAllRanges();
  };

  return (
    <div
      ref={viewerRef}
      className={`pdf-selection-viewer pdf-select-mode-${selectionMode}`}
      onMouseUp={handleMouseUp}
    >
      <Document
        file={fileData ? { data: new Uint8Array(fileData) } : null}
        loading={<div className="pdf-viewer-state">Chargement du PDF...</div>}
        error={
          <div className="pdf-viewer-state">
            {errorMessage || "Impossible de charger le document PDF."}
          </div>
        }
        onLoadSuccess={({ numPages: pages }) => {
          setErrorMessage("");
          setNumPages(pages);
        }}
        onLoadError={(error) => {
          setErrorMessage(`Impossible de charger le document PDF. ${error.message ?? ""}`.trim());
        }}
      >
        {Array.from({ length: numPages }, (_, index) => (
          <div key={`page-${index + 1}`} className="pdf-page-shell">
            <div className="pdf-page-label">Page {index + 1}</div>
            <Page
              pageNumber={index + 1}
              width={pageWidth}
              renderAnnotationLayer
              renderTextLayer
            />
          </div>
        ))}
      </Document>
    </div>
  );
}

export default PdfLabelingViewer;
