import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Variable, 
  Eye, 
  Copy,
  RotateCcw,
  Paperclip,
  AlertCircle,
  Info
} from 'lucide-react';
import { ReminderLevel } from '../../types/reminder';

interface TemplateData {
  subject: string;
  body: string;
  attachOriginalInvoice: boolean;
  includeLegalText: boolean;
}

interface ReminderTemplateEditorProps {
  level: ReminderLevel;
  template: TemplateData;
  onChange: (template: TemplateData) => void;
  onReset?: () => void;
}

const TEMPLATE_VARIABLES = [
  { name: 'invoiceNumber', description: 'Rechnungsnummer', example: 'RE-2024-001' },
  { name: 'invoiceDate', description: 'Rechnungsdatum', example: '15.03.2024' },
  { name: 'dueDate', description: 'Fälligkeitsdatum', example: '15.04.2024' },
  { name: 'customerName', description: 'Kundenname', example: 'Max Mustermann' },
  { name: 'amount', description: 'Rechnungsbetrag', example: '1.500,00' },
  { name: 'reminderFee', description: 'Mahngebühr', example: '5,00' },
  { name: 'interestAmount', description: 'Verzugszinsen', example: '12,50' },
  { name: 'totalAmount', description: 'Gesamtbetrag', example: '1.517,50' },
  { name: 'daysOverdue', description: 'Tage überfällig', example: '14' },
  { name: 'companyName', description: 'Ihr Firmenname', example: 'Muster GmbH' },
  { name: 'companyIban', description: 'Ihre IBAN', example: 'DE12 3456 7890 1234 5678 90' },
  { name: 'companyBic', description: 'Ihre BIC', example: 'ABCDEFGHIJK' },
  { name: 'lastReminderDate', description: 'Datum letzte Mahnung', example: '01.04.2024' },
  { name: 'previousReminderFee', description: 'Vorherige Mahngebühr', example: '5,00' },
  { name: 'totalReminderFees', description: 'Summe Mahngebühren', example: '15,00' },
];

const getLevelName = (level: ReminderLevel) => {
  switch (level) {
    case ReminderLevel.FRIENDLY:
      return 'Zahlungserinnerung';
    case ReminderLevel.FIRST_REMINDER:
      return '1. Mahnung';
    case ReminderLevel.SECOND_REMINDER:
      return '2. Mahnung';
    case ReminderLevel.FINAL_NOTICE:
      return 'Letzte Mahnung';
    case ReminderLevel.LEGAL_ACTION:
      return 'Inkasso-Mitteilung';
    default:
      return '';
  }
};

const ReminderTemplateEditor: React.FC<ReminderTemplateEditorProps> = ({
  level,
  template,
  onChange,
  onReset
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(true);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const insertVariable = (variableName: string, targetRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = targetRef.current;
    if (!target) return;

    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const text = target.value;
    const newText = text.substring(0, start) + `{${variableName}}` + text.substring(end);
    
    if (target === subjectRef.current) {
      onChange({ ...template, subject: newText });
    } else {
      onChange({ ...template, body: newText });
    }

    // Set cursor position after the inserted variable
    setTimeout(() => {
      target.focus();
      const newPosition = start + variableName.length + 2;
      target.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const replaceVariables = (text: string): string => {
    let result = text;
    TEMPLATE_VARIABLES.forEach(variable => {
      const regex = new RegExp(`{${variable.name}}`, 'g');
      result = result.replace(regex, `<span class="bg-blue-100 text-blue-700 px-1 rounded">${variable.example}</span>`);
    });
    return result;
  };

  const getPreviewContent = () => {
    const previewSubject = replaceVariables(template.subject);
    const previewBody = replaceVariables(template.body);
    
    return {
      subject: previewSubject,
      body: previewBody.split('\n').join('<br>')
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          E-Mail-Vorlage: {getLevelName(level)}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Editor' : 'Vorschau'}
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Variables Help */}
      {showVariables && !showPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Verfügbare Variablen</p>
              <p className="text-xs text-blue-700 mt-1">
                Klicken Sie auf eine Variable, um sie an der Cursorposition einzufügen.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {TEMPLATE_VARIABLES.map(variable => (
              <div
                key={variable.name}
                className="bg-white rounded px-3 py-2 text-xs border border-blue-200 hover:border-blue-400 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => insertVariable(variable.name, document.activeElement === subjectRef.current ? subjectRef : bodyRef)}
                  className="w-full text-left"
                >
                  <code className="text-blue-600 font-mono">{`{${variable.name}}`}</code>
                  <div className="text-gray-600 mt-1">{variable.description}</div>
                  <div className="text-gray-400 mt-0.5">z.B.: {variable.example}</div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor/Preview */}
      <div className="grid grid-cols-1 gap-6">
        {showPreview ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Betreff:</h4>
                  <div 
                    className="text-lg font-medium"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent().subject }}
                  />
                </div>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Nachricht:</h4>
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent().body }}
                  />
                </div>
                {(template.attachOriginalInvoice || template.includeLegalText) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Anhänge & Optionen:</h4>
                    <div className="space-y-2">
                      {template.attachOriginalInvoice && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Paperclip className="w-4 h-4" />
                          <span>Original-Rechnung wird angehängt</span>
                        </div>
                      )}
                      {template.includeLegalText && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>Rechtlicher Hinweistext wird hinzugefügt</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Betreff
              </label>
              <input
                ref={subjectRef}
                type="text"
                value={template.subject}
                onChange={(e) => onChange({ ...template, subject: e.target.value })}
                className="input-field font-mono text-sm"
                placeholder="Betreff der E-Mail..."
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Nachrichtentext
              </label>
              <textarea
                ref={bodyRef}
                value={template.body}
                onChange={(e) => onChange({ ...template, body: e.target.value })}
                className="input-field font-mono text-sm"
                rows={12}
                placeholder="Text der E-Mail..."
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.attachOriginalInvoice}
                  onChange={(e) => onChange({ ...template, attachOriginalInvoice: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Original-Rechnung als PDF anhängen
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.includeLegalText}
                  onChange={(e) => onChange({ ...template, includeLegalText: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Rechtlichen Hinweistext hinzufügen
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderTemplateEditor;