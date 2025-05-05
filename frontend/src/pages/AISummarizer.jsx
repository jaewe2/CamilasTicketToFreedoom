import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import "./AISummarizer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function AISummarizer() {
  const [pdfText, setPdfText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setError("");
    setPdfText("");
    setSummary("");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async function () {
      const typedArray = new Uint8Array(this.result);

      try {
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          fullText += strings.join(" ") + "\n\n";
        }

        setPdfText(fullText);
        summarizeText(fullText);
      } catch (err) {
        console.error(err);
        setError("Failed to extract text from PDF.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const summarizeText = async (text) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/gemini-summarize/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setSummary(data.candidates[0].content.parts[0].text);
      } else {
        console.error(data);
        setError("Failed to summarize text.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong during summarization.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "syllabus_summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ai-summarizer-container">
      <h2 className="title">Upload Your Syllabus PDF</h2>
      <input type="file" accept="application/pdf" onChange={handlePDFUpload} />
      {error && <p className="error-text">{error}</p>}
      {loading && <p className="loading-text">Loading...</p>}

      {summary && (
        <>
          <h3 className="summary-title">Summary:</h3>
          <textarea value={summary} readOnly rows={15} style={{ width: "100%" }} />
          <button onClick={downloadSummary} className="download-btn">Download Summary</button>
        </>
      )}
    </div>
  );
}