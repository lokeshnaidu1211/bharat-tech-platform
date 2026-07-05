import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS } from '../data/translations';
import { 
  ShieldCheck, 
  Upload, 
  FileText, 
  Trash2, 
  Lock, 
  Key, 
  Terminal, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  FileCheck2, 
  FileX2, 
  CheckCircle,
  HelpCircle,
  Info,
  Download,
  Fingerprint
} from 'lucide-react';

interface VerificationDocument {
  id: string;
  name: string;
  size: string;
  type: 'AADHAAR' | 'GSTIN' | 'FSSAI' | 'DRIVING_LICENSE' | 'PAN_CARD';
  uploadedAt: string;
  expiryDate: string;
  hash: string;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  ephemeralKey: string;
}

interface SecureVerificationVaultProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecureVerificationVault: React.FC<SecureVerificationVaultProps> = ({ isOpen, onClose }) => {
  const { loggedInUser, language, addNotification } = useApp();
  const t = TRANSLATIONS[language];

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  
  // Vault data state
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<'AADHAAR' | 'GSTIN' | 'FSSAI' | 'DRIVING_LICENSE' | 'PAN_CARD'>('AADHAAR');
  
  // Encryption state visualization
  const [encryptingFile, setEncryptingFile] = useState<string | null>(null);
  const [encryptionProgress, setEncryptionProgress] = useState(0);

  // Compliance Audit logs specific to documents
  const [docLogs, setDocLogs] = useState<string[]>([]);
  
  // Custom manual file upload selector helper state
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  useEffect(() => {
    if (loggedInUser && isOpen) {
      // Load existing documents
      const savedDocs = localStorage.getItem(`dpdp_docs_${loggedInUser.id}`);
      if (savedDocs) {
        try {
          setDocuments(JSON.parse(savedDocs));
        } catch (e) {
          console.error('Failed to parse saved docs', e);
        }
      } else {
        // Seed default compliant document based on role to make it feel populated & realistic
        const initialDocs: VerificationDocument[] = [];
        const rightNow = new Date();
        const formattedDate = rightNow.toLocaleDateString();
        const baseHash = Math.random().toString(36).slice(2, 10).toUpperCase();

        if (loggedInUser.role === 'MERCHANT') {
          initialDocs.push({
            id: 'DOC-GSTIN-001',
            name: 'GST_Registration_Certificate_Signed.pdf',
            size: '1.2 MB',
            type: 'GSTIN',
            uploadedAt: formattedDate,
            expiryDate: '12/08/2030',
            hash: `SHA256-GST-${baseHash}`,
            status: 'VERIFIED',
            ephemeralKey: `AES-GCM-KEY-GST-${baseHash}`
          });
        } else if (loggedInUser.role === 'DELIVERY_PARTNER') {
          initialDocs.push({
            id: 'DOC-LIC-002',
            name: 'Driving_License_Swadeshi_Rider.pdf',
            size: '890 KB',
            type: 'DRIVING_LICENSE',
            uploadedAt: formattedDate,
            expiryDate: '10/11/2032',
            hash: `SHA256-LIC-${baseHash}`,
            status: 'VERIFIED',
            ephemeralKey: `AES-GCM-KEY-LIC-${baseHash}`
          });
        } else if (loggedInUser.role === 'INFLUENCER') {
          initialDocs.push({
            id: 'DOC-PAN-003',
            name: 'Income_Tax_PAN_Card_Verified.pdf',
            size: '450 KB',
            type: 'PAN_CARD',
            uploadedAt: formattedDate,
            expiryDate: 'Permanent',
            hash: `SHA256-PAN-${baseHash}`,
            status: 'VERIFIED',
            ephemeralKey: `AES-GCM-KEY-PAN-${baseHash}`
          });
        }

        // Add default Aadhaar doc which applies to everyone
        initialDocs.push({
          id: 'DOC-UID-000',
          name: 'Aadhaar_Virtual_ID_eKYC_Ephemera.pdf',
          size: '340 KB',
          type: 'AADHAAR',
          uploadedAt: formattedDate,
          expiryDate: '01/01/2035',
          hash: `SHA256-UID-EPHEMERAL`,
          status: 'VERIFIED',
          ephemeralKey: 'AES-GCM-KEY-UID-EPHEMERAL'
        });

        setDocuments(initialDocs);
        localStorage.setItem(`dpdp_docs_${loggedInUser.id}`, JSON.stringify(initialDocs));
      }

      // Load or initialize Document Logs
      const savedLogs = localStorage.getItem(`dpdp_doc_logs_${loggedInUser.id}`);
      if (savedLogs) {
        try {
          setDocLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error(e);
        }
      } else {
        const initLogs = [
          `[${new Date().toLocaleTimeString()}] Secure sandbox verification storage initialized.`,
          `[${new Date().toLocaleTimeString()}] Encrypted storage node: SECURE-S3-MANDI active.`,
          `[${new Date().toLocaleTimeString()}] All objects subject to automatic Section 12 Purge requests.`
        ];
        setDocLogs(initLogs);
        localStorage.setItem(`dpdp_doc_logs_${loggedInUser.id}`, JSON.stringify(initLogs));
      }
    }
  }, [loggedInUser, isOpen]);

  if (!loggedInUser) return null;

  // Document helper values
  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'AADHAAR': return 'Aadhaar Card (UIDAI Verified)';
      case 'GSTIN': return 'GSTIN Registration Certificate';
      case 'FSSAI': return 'FSSAI Food Safety License';
      case 'DRIVING_LICENSE': return 'Driving License (EV Logistics)';
      case 'PAN_CARD': return 'PAN Tax Identity Card';
      default: return 'Service Certificate';
    }
  };

  // Log helper
  const addDocLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    const newLog = `[${time}] ${message}`;
    setDocLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem(`dpdp_doc_logs_${loggedInUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Process selected file
  const processDocumentUpload = (fileName: string, fileSize: number) => {
    const sizeStr = fileSize > 1024 * 1024 
      ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` 
      : `${(fileSize / 1024).toFixed(0)} KB`;

    setEncryptingFile(fileName);
    setEncryptionProgress(10);

    // Simulate encryption ticks
    const interval = setInterval(() => {
      setEncryptionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            finalizeUpload(fileName, sizeStr);
          }, 300);
          return 100;
        }
        return prev + 15;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processDocumentUpload(file.name, file.size);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processDocumentUpload(file.name, file.size);
    }
  };

  const finalizeUpload = (fileName: string, sizeStr: string) => {
    const randomHashSuffix = Math.random().toString(36).slice(2, 10).toUpperCase();
    const newDocId = `DOC-${selectedDocType}-${Math.floor(100 + Math.random() * 900)}`;
    
    const newDoc: VerificationDocument = {
      id: newDocId,
      name: fileName,
      size: sizeStr,
      type: selectedDocType,
      uploadedAt: new Date().toLocaleDateString(),
      expiryDate: selectedDocType === 'PAN_CARD' ? 'Permanent' : new Date(Date.now() + 365 * 4 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 4 years expiry
      hash: `SHA256-${selectedDocType}-${randomHashSuffix}`,
      status: 'VERIFIED', // Autoverified via Swadeshi Gate sandbox
      ephemeralKey: `AES-GCM-KEY-${selectedDocType}-${randomHashSuffix}`
    };

    const nextDocs = [newDoc, ...documents];
    setDocuments(nextDocs);
    localStorage.setItem(`dpdp_docs_${loggedInUser.id}`, JSON.stringify(nextDocs));

    addDocLog(`Successfully uploaded and encrypted file: ${fileName}. Type: ${selectedDocType}. Hash: ${newDoc.hash}`);
    addDocLog(`Ephesian-Zero Retention active. Master secret key stored locally under client context.`);
    
    setEncryptingFile(null);
    setEncryptionProgress(0);
    addNotification(`Secure Compliance Upload: ${fileName} registered and verified in zero-retention vault.`);
  };

  // Right to Erasure / Revoke Consent for specific document
  const handleErasureRequest = (docId: string, docName: string) => {
    const confirmed = window.confirm(`Under Section 12(3) of the DPDP Act 2023 (Right to Correction and Erasure), do you wish to permanently purge the document "${docName}" from our secure sandbox nodes? This action is immediate and completely irreversible.`);
    if (!confirmed) return;

    const updatedDocs = documents.filter((d) => d.id !== docId);
    setDocuments(updatedDocs);
    localStorage.setItem(`dpdp_docs_${loggedInUser.id}`, JSON.stringify(updatedDocs));

    addDocLog(`Section 12(3) Erasure triggered for ${docId} (${docName}). Bytes permanently purged from block nodes.`);
    addNotification(`DPDP Purge: Verification document ${docName} and its metadata have been erased.`);
  };

  // Full Purge - Deletes everything and resets
  const handleResetAllDocs = () => {
    const confirmed = window.confirm(`WARNING: This will execute a full cryptographic wipe of your secure verification documents cabinet. This is compliance-tested to prevent residual server data. Are you sure you want to proceed?`);
    if (!confirmed) return;

    localStorage.removeItem(`dpdp_docs_${loggedInUser.id}`);
    localStorage.removeItem(`dpdp_doc_logs_${loggedInUser.id}`);
    setDocuments([]);
    setDocLogs([
      `[${new Date().toLocaleTimeString()}] Secure memory completely wiped.`,
      `[${new Date().toLocaleTimeString()}] Zero bits remaining in index keys.`
    ]);
    addNotification(`Statutory Compliance Wipe: Verification logs and active IDs deleted successfully.`);
  };

  return (
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
      <div id="secure-verification-vault" className="bg-white rounded-xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-slate-950">
        
        {/* Compliance Tricolor top line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-500"></div>

        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 md:p-6 shrink-0 relative">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-[9px] font-mono font-bold text-slate-400 tracking-widest uppercase">
                  DPI CERTIFICATION CABINET &bull; DPDP ACT SECURE STORAGE
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-light text-slate-100 font-display">
                Service Provider <span className="font-bold text-emerald-400">Compliance & KYC Vault</span>
              </h2>
              <p className="text-[10.5px] text-slate-400 max-w-2xl leading-normal">
                Legally mandated under Section 11 & 12 of the DPDP Act, 2023. Upload, verify, and monitor the encryption logs of certificates. All files are encrypted client-side using ephemeral keys before storage node upload.
              </p>
            </div>

            <button 
              onClick={onClose}
              id="close-vault-modal"
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-sm text-xs font-mono font-bold transition-all cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Body grid */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
          
          {/* LEFT: Upload controls and details (col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Upload form container */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Upload className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">I. Add New Document Credentials</h3>
              </div>

              {/* Selector for Doc Type */}
              <div className="space-y-1.5">
                <label htmlFor="vault-doc-type" className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  Select Document / Certificate Category
                </label>
                <select
                  id="vault-doc-type"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-sm focus:outline-none focus:border-slate-950"
                >
                  <option value="AADHAAR">Aadhaar Card (UIDAI Verified Copy)</option>
                  {loggedInUser.role === 'MERCHANT' && (
                    <>
                      <option value="GSTIN">GSTIN Registration Certificate</option>
                      <option value="FSSAI">FSSAI Food Safety License / Certificate</option>
                    </>
                  )}
                  {loggedInUser.role === 'DELIVERY_PARTNER' && (
                    <option value="DRIVING_LICENSE">Driving License (RTO-linked EV)</option>
                  )}
                  <option value="PAN_CARD">Income Tax PAN Identification Card</option>
                </select>
              </div>

              {/* Drag and Drop box */}
              <div
                id="vault-drag-drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('vault-file-selector')?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/40' 
                    : 'border-slate-250 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="file"
                  id="vault-file-selector"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />

                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                  <Upload className="w-5 h-5 text-slate-600" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Drag & Drop Certificate here, or <span className="text-indigo-600 underline">browse file</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Supports PDF, PNG, JPG (Max 5MB). Encrypted on-device.
                  </p>
                </div>
              </div>

              {/* Inline simulator feedback of encryption progress */}
              {encryptingFile && (
                <div className="bg-slate-900 text-white p-3.5 rounded-sm border border-slate-800 space-y-2 animate-pulse text-xs font-mono">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400 animate-spin" />
                      Encrypting: {encryptingFile.slice(0, 24)}...
                    </span>
                    <span className="text-emerald-400">{encryptionProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${encryptionProgress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    Generating PBKDF2 seed. Locking symmetric salt parameters...
                  </span>
                </div>
              )}

              {/* Helpful DPDP compliance notice widget */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-sm text-xs text-indigo-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-indigo-700" />
                  <span>Statutory Notice on Retention</span>
                </div>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  Our system employs <strong>Zero-Retention Cryptographic Proxies</strong>. Documents uploaded here are not indexed publicly nor stored as open assets. To revoke processing instantly, tap the deletion trashcan.
                </p>
              </div>

            </div>

            {/* General statutory actions card */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">BULK AUDIT COMPLIANCE CONTROLS</span>
              <p className="text-[11px] text-slate-500 leading-normal">
                Wipe entire session cache logs, remove biometric tokens, and clear credentials instantly from storage.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResetAllDocs}
                  id="vault-bulk-wipe"
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Perform Cryptographic Wipe
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: List of Documents & Real-time secure logs (col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active documents list */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-2xs">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4.5 h-4.5 text-slate-850" />
                  <h3 className="text-xs font-black uppercase text-slate-950 tracking-wider">II. Active Encrypted Credentials Cabinet</h3>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {documents.length} File Node{documents.length !== 1 && 's'}
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-250 text-center rounded space-y-2">
                  <FileX2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No active verified credentials found.</p>
                  <p className="text-[10.5px] text-slate-400">Use the Left-side panel to drag or browse standard verification PDF documents.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-sm border border-slate-200 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-xs tracking-wider">
                            {doc.type}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate block max-w-[200px]" title={doc.name}>
                            {doc.name}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 text-[8px] font-bold uppercase px-1 rounded-sm">
                            {doc.status}
                          </span>
                        </div>

                        <p className="text-[10.5px] font-semibold text-slate-600">
                          Category: <span className="font-bold text-slate-800">{getDocTypeLabel(doc.type)}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] text-slate-400 font-mono">
                          <div>ID Ref: <span className="text-slate-600 font-bold">{doc.id}</span></div>
                          <div>Size: <span className="text-slate-600">{doc.size}</span></div>
                          <div className="col-span-2 truncate">Doc Hash: <span className="text-indigo-600 font-bold">{doc.hash}</span></div>
                          <div className="col-span-2">Key: <span className="text-slate-500 font-bold">{doc.ephemeralKey}</span></div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-stretch gap-2 shrink-0 w-full md:w-auto">
                        <div className="bg-white px-2.5 py-1 border border-slate-200 rounded-sm text-center text-[9px] font-mono text-slate-500 flex-1 md:flex-initial">
                          <span className="block text-[8px] text-slate-400 uppercase font-bold">Expiry Date</span>
                          <strong className="text-slate-700">{doc.expiryDate}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleErasureRequest(doc.id, doc.name)}
                          className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          Purge Doc
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Real-time system compliance telemetry */}
            <div className="bg-slate-900 text-slate-100 p-5 rounded-lg border border-slate-850 space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    III. Statutory Secure Telemetry Logs
                  </h3>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 border border-emerald-500/20 rounded-sm animate-pulse">
                  ZERO RETENTION PROMPT ACTIVE
                </span>
              </div>

              {/* Logs display */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-40 overflow-y-auto space-y-1 font-mono text-[9px] leading-relaxed text-slate-400 scrollbar-none">
                {docLogs.length === 0 ? (
                  <p className="text-slate-600 italic">No storage log transactions registered.</p>
                ) : (
                  docLogs.map((log, index) => (
                    <div key={index} className="hover:bg-slate-900/50 transition-colors">
                      <span className="text-emerald-500/80 mr-1">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>Compliance Authority: <strong>NPCI-DPI-DELHI</strong></span>
                <span>Audit standard: <strong>ISO/IEC 27001</strong></span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
