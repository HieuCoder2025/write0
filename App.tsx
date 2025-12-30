import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Document, AppSettings, PastedRange } from './types';
import { INITIAL_DOC_ID, INITIAL_FOLDER_ID, WELCOME_CONTENT } from './constants';
import {
  Eye,
  Monitor,
  Columns,
  TextSearch,
  Moon,
  Sun,
  PanelLeft,
  Share,
  ClipboardPen,
} from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { HelpModal } from './components/HelpModal';
import { ConfirmModal } from './components/ConfirmModal';
import { exportToHTML, exportToText, exportToPDF } from './utils/exportUtils';
import { readJson, writeJson, STORAGE_KEYS } from './utils/storageUtils';

const App: React.FC = () => {
  const hasShownStorageErrorRef = useRef(false);

  // --- State ---
  const [documents, setDocuments] = useState<Document[]>(() => {
    const fallback: Document[] = [
      {
        id: INITIAL_DOC_ID,
        title: 'Welcome',
        content: WELCOME_CONTENT,
        folderId: INITIAL_FOLDER_ID,
        updatedAt: Date.now(),
      },
    ];

    const saved = readJson<Document[]>(STORAGE_KEYS.documents, fallback);
    return Array.isArray(saved) && saved.length > 0 ? saved : fallback;
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    return readJson<string>(STORAGE_KEYS.activeDocumentId, INITIAL_DOC_ID);
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const fallback: AppSettings = {
      theme: 'light',
      focusMode: false,
      typewriterMode: false,
      styleCheck: false,
      showPreview: false,
      showSidebar: true,
      highlightPastedText: true,
    };

    return readJson<AppSettings>(STORAGE_KEYS.settings, fallback);
  });

  // Distraction free typing state
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Help Modal state
  const [showHelp, setShowHelp] = useState(false);

  // Confirm delete state
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  // --- Derived State ---
  const activeDoc = useMemo(
    () => documents.find((d) => d.id === activeDocId),
    [documents, activeDocId],
  );

  useEffect(() => {
    if (documents.length === 0) return;
    if (documents.some((d) => d.id === activeDocId)) return;
    setActiveDocId(documents[0].id);
  }, [documents, activeDocId]);

  const wordCount = useMemo(() => {
    if (!activeDoc) return 0;
    return activeDoc.content
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }, [activeDoc]);

  const readingTime = Math.ceil(wordCount / 200);

  // --- Handlers ---
  const toggleSetting = useCallback((key: keyof AppSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // --- Effects ---
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const result = writeJson(STORAGE_KEYS.documents, documents);
      if (result.ok === false) {
        if (hasShownStorageErrorRef.current) return;

        hasShownStorageErrorRef.current = true;
        console.warn('Failed to persist documents to localStorage:', result.reason);
        if (result.reason === 'quota') {
          alert(
            'write0 could not save because browser storage is full. Consider deleting old documents or freeing up site data.',
          );
        }
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [documents]);

  useEffect(() => {
    const result = writeJson(STORAGE_KEYS.activeDocumentId, activeDocId);
    if (result.ok === false) {
      console.warn('Failed to persist active document id to localStorage:', result.reason);
    }
  }, [activeDocId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const result = writeJson(STORAGE_KEYS.settings, settings);
      if (result.ok === false) {
        if (hasShownStorageErrorRef.current) return;

        hasShownStorageErrorRef.current = true;
        console.warn('Failed to persist settings to localStorage:', result.reason);
        if (result.reason === 'quota') {
          alert('write0 could not save settings because browser storage is full.');
        }
      }
    }, 250);

    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => window.clearTimeout(timeoutId);
  }, [settings]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  // Handle typing detection to fade UI
  useEffect(() => {
    const handleMouseMove = () => {
      if (!isTypingRef.current) return;

      setIsTyping(false);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSetting('showSidebar');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSetting]);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // --- Handlers ---
  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    // UI reappears after 1.5 seconds of inactivity
    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  const handleUpdateContent = (content: string) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === activeDocId) {
          const updates: Partial<Document> = { content, updatedAt: Date.now() };
          if (!doc.hasCustomTitle) {
            updates.title =
              content.split('\n')[0].replace(/#+\s/, '').substring(0, 40) || 'Untitled';
          }
          return { ...doc, ...updates };
        }
        return doc;
      }),
    );
  };

  const handlePastedRangesChange = useCallback(
    (ranges: PastedRange[]) => {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            return { ...doc, pastedRanges: ranges };
          }
          return doc;
        }),
      );
    },
    [activeDocId],
  );

  const handleRenameDoc = (id: string, title: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, title, hasCustomTitle: true, updatedAt: Date.now() } : doc,
      ),
    );
  };

  const handleCreateDoc = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '',
      folderId: INITIAL_FOLDER_ID,
      updatedAt: Date.now(),
      hasCustomTitle: false,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    if (window.innerWidth < 768) {
      setSettings((s) => ({ ...s, showSidebar: false }));
    }
  };

  const handleDeleteDoc = (id: string) => {
    setDeleteDocId(id);
  };

  const handleConfirmDeleteDoc = () => {
    if (!deleteDocId) return;

    setDocuments((prev) => {
      const nextDocs = prev.filter((d) => d.id !== deleteDocId);
      if (activeDocId === deleteDocId) {
        setActiveDocId(nextDocs[0]?.id ?? activeDocId);
      }
      return nextDocs;
    });

    setDeleteDocId(null);
  };

  const handleExport = (type: 'html' | 'md' | 'pdf') => {
    if (!activeDoc) return;
    if (type === 'html') exportToHTML(activeDoc.title, activeDoc.content);
    if (type === 'md') exportToText(activeDoc.title, activeDoc.content);
    if (type === 'pdf') exportToPDF(activeDoc.title, activeDoc.content);
    setShowExportMenu(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <ConfirmModal
        isOpen={deleteDocId !== null}
        title="Delete document?"
        description="This will permanently remove it from this device."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => setDeleteDocId(null)}
        onConfirm={handleConfirmDeleteDoc}
      />

      {/* Sidebar - Fades out when typing */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          settings.showSidebar ? 'w-0 md:w-72' : 'w-0'
        } ${isTyping ? 'opacity-0 pointer-events-none delay-200' : 'opacity-100 delay-0'}`}
      >
        <Sidebar
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={(id) => {
            setActiveDocId(id);
            if (window.innerWidth < 768) setSettings((s) => ({ ...s, showSidebar: false }));
          }}
          onCreateDoc={handleCreateDoc}
          onDeleteDoc={handleDeleteDoc}
          onRenameDoc={handleRenameDoc}
          isOpen={settings.showSidebar}
          onClose={() => setSettings((s) => ({ ...s, showSidebar: false }))}
          onTriggerHelp={() => setShowHelp(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900 transition-all duration-300 relative">
        {/* Top Bar - Fades out when typing */}
        <div
          className={`h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-900 z-20 flex-shrink-0 transition-opacity duration-700 ease-in-out ${isTyping ? 'opacity-0 pointer-events-none delay-200' : 'opacity-100 delay-0'}`}
        >
          <div className="flex items-center gap-4">
            <Tooltip content="Toggle Sidebar" position="right">
              <button
                onClick={() => toggleSetting('showSidebar')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400"
                aria-label="Toggle sidebar"
              >
                <PanelLeft size={20} />
              </button>
            </Tooltip>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline-block">
              {wordCount} words <span className="mx-1">•</span> {readingTime} min read
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Tooltip content="Focus Mode" position="bottom">
              <button
                onClick={() => toggleSetting('focusMode')}
                className={`p-2 rounded-md transition-colors ${settings.focusMode ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                aria-label={settings.focusMode ? 'Disable focus mode' : 'Enable focus mode'}
              >
                <Eye size={18} />
              </button>
            </Tooltip>

            <Tooltip content="Style Check" position="bottom">
              <button
                onClick={() => toggleSetting('styleCheck')}
                className={`p-2 rounded-md transition-colors hidden sm:block ${settings.styleCheck ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                aria-label={settings.styleCheck ? 'Disable style check' : 'Enable style check'}
              >
                <TextSearch size={18} />
              </button>
            </Tooltip>

            <Tooltip content="Highlight Pasted Text" position="bottom">
              <button
                onClick={() => toggleSetting('highlightPastedText')}
                className={`p-2 rounded-md transition-colors hidden sm:block ${settings.highlightPastedText ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                aria-label={
                  settings.highlightPastedText
                    ? 'Disable pasted text highlighting'
                    : 'Enable pasted text highlighting'
                }
              >
                <ClipboardPen size={18} />
              </button>
            </Tooltip>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <Tooltip
              content={`Switch to ${settings.theme === 'light' ? 'Dark' : 'Light'} Mode`}
              position="bottom"
            >
              <button
                onClick={() =>
                  setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))
                }
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 rounded-md"
                aria-label={
                  settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
                }
              >
                {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </Tooltip>

            <Tooltip
              content={settings.showPreview ? 'Hide Preview' : 'Show Preview'}
              position="bottom"
            >
              <button
                onClick={() => toggleSetting('showPreview')}
                className={`p-2 rounded-md transition-colors ${settings.showPreview ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                aria-label={settings.showPreview ? 'Hide preview' : 'Show preview'}
              >
                {settings.showPreview ? <Columns size={18} /> : <Monitor size={18} />}
              </button>
            </Tooltip>

            <div className="relative" ref={exportMenuRef}>
              <Tooltip content="Export" position="bottom">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className={`p-2 transition-colors rounded-md ${showExportMenu ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'}`}
                  aria-label="Export"
                >
                  <Share size={18} />
                </button>
              </Tooltip>
              {/* Add invisible padding-top to bridge the gap if needed, though now click-based */}
              {showExportMenu && (
                <div className="absolute right-0 top-full pt-2 w-48 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-1">
                    <button
                      onClick={() => handleExport('md')}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => handleExport('html')}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      PDF (Print)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex overflow-hidden relative bg-gray-50 dark:bg-[#191919]">
          {activeDoc ? (
            <>
              <div
                className={`h-full transition-all duration-300 relative ${settings.showPreview ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'}`}
              >
                <Editor
                  content={activeDoc.content}
                  onChange={handleUpdateContent}
                  onTyping={handleTyping}
                  focusMode={settings.focusMode}
                  styleCheck={settings.styleCheck}
                  isSplitMode={settings.showPreview}
                  pastedRanges={activeDoc.pastedRanges}
                  onPastedRangesChange={handlePastedRangesChange}
                  highlightPastedText={settings.highlightPastedText}
                />
              </div>
              {settings.showPreview && (
                <div className="w-1/2 h-full hidden md:block">
                  <Preview content={activeDoc.content} />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
              <p>Select or create a document to start writing</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview Overlay */}
      {settings.showPreview && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 pt-14">
          <div className="absolute top-0 left-0 right-0 h-14 border-b flex items-center justify-between px-4 bg-white dark:bg-gray-900">
            <span className="font-bold">Preview</span>
            <button onClick={() => toggleSetting('showPreview')}>Close</button>
          </div>
          <Preview content={activeDoc?.content || ''} />
        </div>
      )}
    </div>
  );
};

export default App;
