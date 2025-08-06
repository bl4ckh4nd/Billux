import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CompanySettings } from '../../types/settings';
import { ReminderLevel } from '../../types/reminder';
import ReminderTemplateEditor from './ReminderTemplateEditor';
import { 
  Building2, 
  CreditCard, 
  FileText, 
  Bell,
  AlertCircle,
  Check,
  Mail
} from 'lucide-react';

const settingsSchema = z.object({
  name: z.string().min(1, "Firmenname wird benötigt"),
  address: z.string().min(1, "Adresse wird benötigt"),
  taxId: z.string().min(1, "Steuernummer wird benötigt"),
  vatId: z.string().min(1, "USt-IdNr. wird benötigt"),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich"),
  phone: z.string(),
  website: z.string(),
  bankDetails: z.object({
    accountHolder: z.string().min(1, "Kontoinhaber wird benötigt"),
    iban: z.string().min(1, "IBAN wird benötigt"),
    bic: z.string().min(1, "BIC wird benötigt"),
    bankName: z.string().min(1, "Bankname wird benötigt"),
  }),
  invoiceSettings: z.object({
    numberPrefix: z.string(),
    nextNumber: z.number().min(1),
    defaultDueDays: z.number().min(1),
    defaultTaxRate: z.number().min(0).max(100),
    defaultPaymentTerms: z.string(),
  }),
  reminderSettings: z.object({
    enabled: z.boolean(),
    automaticSending: z.boolean(),
    reminderSchedule: z.object({
      friendly: z.number().min(1),
      firstReminder: z.number().min(1),
      secondReminder: z.number().min(1),
      finalNotice: z.number().min(1),
    }),
    reminderFees: z.object({
      firstReminder: z.number().min(0),
      secondReminder: z.number().min(0),
      finalNotice: z.number().min(0),
    }),
    interest: z.object({
      enabled: z.boolean(),
      rate: z.number().min(0).max(100),
      basePlusRate: z.number().min(0).max(100),
    }),
    templates: z.record(z.object({
      subject: z.string(),
      body: z.string(),
      attachOriginalInvoice: z.boolean(),
      includeLegalText: z.boolean(),
    })).optional(),
  }).optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

type TabId = 'company' | 'bank' | 'invoice' | 'reminders' | 'templates';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const SettingsForm = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [activeTemplateLevel, setActiveTemplateLevel] = useState<ReminderLevel>(ReminderLevel.FRIENDLY);

  const { register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const reminderEnabled = watch('reminderSettings.enabled');
  const interestEnabled = watch('reminderSettings.interest.enabled');

  const tabs: TabConfig[] = [
    { id: 'company', label: 'Firmendaten', icon: Building2 },
    { id: 'bank', label: 'Bankverbindung', icon: CreditCard },
    { id: 'invoice', label: 'Rechnungen', icon: FileText },
    { id: 'reminders', label: 'Mahnungen', icon: Bell },
    { id: 'templates', label: 'E-Mail-Vorlagen', icon: Mail },
  ];

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaveStatus('saving');
      await updateSettings.mutateAsync(data as CompanySettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const renderCompanyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
          Firmendaten
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Firmenname
            </label>
            <input
              {...register('name')}
              className="input-field"
              placeholder="Muster GmbH"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Steuernummer
            </label>
            <input
              {...register('taxId')}
              className="input-field"
              placeholder="12/345/67890"
            />
            {errors.taxId && (
              <p className="text-red-500 text-xs mt-1">{errors.taxId.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              USt-IdNr.
            </label>
            <input
              {...register('vatId')}
              className="input-field"
              placeholder="DE123456789"
            />
            {errors.vatId && (
              <p className="text-red-500 text-xs mt-1">{errors.vatId.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              E-Mail
            </label>
            <input
              {...register('email')}
              type="email"
              className="input-field"
              placeholder="info@muster-gmbh.de"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Telefon
            </label>
            <input
              {...register('phone')}
              className="input-field"
              placeholder="+49 123 456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Website
            </label>
            <input
              {...register('website')}
              className="input-field"
              placeholder="www.muster-gmbh.de"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Adresse
            </label>
            <textarea
              {...register('address')}
              className="input-field"
              rows={2}
              placeholder="Musterstraße 123, 12345 Musterstadt"
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBankTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
          Bankverbindung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Kontoinhaber
            </label>
            <input
              {...register('bankDetails.accountHolder')}
              className="input-field"
            />
            {errors.bankDetails?.accountHolder && (
              <p className="text-red-500 text-xs mt-1">{errors.bankDetails.accountHolder.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Bankname
            </label>
            <input
              {...register('bankDetails.bankName')}
              className="input-field"
            />
            {errors.bankDetails?.bankName && (
              <p className="text-red-500 text-xs mt-1">{errors.bankDetails.bankName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              IBAN
            </label>
            <input
              {...register('bankDetails.iban')}
              className="input-field"
              placeholder="DE12 3456 7890 1234 5678 90"
            />
            {errors.bankDetails?.iban && (
              <p className="text-red-500 text-xs mt-1">{errors.bankDetails.iban.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              BIC
            </label>
            <input
              {...register('bankDetails.bic')}
              className="input-field"
              placeholder="ABCDEFGHIJK"
            />
            {errors.bankDetails?.bic && (
              <p className="text-red-500 text-xs mt-1">{errors.bankDetails.bic.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInvoiceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
          Rechnungseinstellungen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Rechnungsnummer-Präfix
            </label>
            <input
              {...register('invoiceSettings.numberPrefix')}
              className="input-field"
              placeholder="RE-"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Nächste Rechnungsnummer
            </label>
            <input
              {...register('invoiceSettings.nextNumber', { valueAsNumber: true })}
              type="number"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Standard-Zahlungsfrist (Tage)
            </label>
            <input
              {...register('invoiceSettings.defaultDueDays', { valueAsNumber: true })}
              type="number"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Standard-Steuersatz (%)
            </label>
            <input
              {...register('invoiceSettings.defaultTaxRate', { valueAsNumber: true })}
              type="number"
              step="0.1"
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Standard-Zahlungsbedingungen
            </label>
            <textarea
              {...register('invoiceSettings.defaultPaymentTerms')}
              className="input-field"
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRemindersTab = () => (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Mahnwesen aktivieren
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Aktiviert das Erstellen und Versenden von Mahnungen
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            {...register('reminderSettings.enabled')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {reminderEnabled && (
        <>
          {/* Automatic Sending */}
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Automatischer Versand
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Mahnungen werden automatisch nach Fälligkeit versendet
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('reminderSettings.automaticSending')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Reminder Schedule */}
          <div>
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Mahnzeitplan (Tage nach Fälligkeit)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Zahlungserinnerung
                </label>
                <input
                  {...register('reminderSettings.reminderSchedule.friendly', { valueAsNumber: true })}
                  type="number"
                  className="input-field"
                  placeholder="7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  1. Mahnung
                </label>
                <input
                  {...register('reminderSettings.reminderSchedule.firstReminder', { valueAsNumber: true })}
                  type="number"
                  className="input-field"
                  placeholder="14"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  2. Mahnung
                </label>
                <input
                  {...register('reminderSettings.reminderSchedule.secondReminder', { valueAsNumber: true })}
                  type="number"
                  className="input-field"
                  placeholder="21"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Letzte Mahnung
                </label>
                <input
                  {...register('reminderSettings.reminderSchedule.finalNotice', { valueAsNumber: true })}
                  type="number"
                  className="input-field"
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Reminder Fees */}
          <div>
            <h3 className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              Mahngebühren (EUR)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  1. Mahnung
                </label>
                <input
                  {...register('reminderSettings.reminderFees.firstReminder', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  2. Mahnung
                </label>
                <input
                  {...register('reminderSettings.reminderFees.secondReminder', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="10.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Letzte Mahnung
                </label>
                <input
                  {...register('reminderSettings.reminderFees.finalNotice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="15.00"
                />
              </div>
            </div>
          </div>

          {/* Interest Settings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Verzugszinsen
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('reminderSettings.interest.enabled')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {interestEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Zinssatz (% p.a.)
                  </label>
                  <input
                    {...register('reminderSettings.interest.rate', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="8.17"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    Basiszinssatz + Prozentpunkte
                  </label>
                  <input
                    {...register('reminderSettings.interest.basePlusRate', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="input-field"
                    placeholder="5"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
          E-Mail-Vorlagen für Mahnungen
        </h3>
        
        {/* Template Level Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {[
              { level: ReminderLevel.FRIENDLY, label: 'Zahlungserinnerung' },
              { level: ReminderLevel.FIRST_REMINDER, label: '1. Mahnung' },
              { level: ReminderLevel.SECOND_REMINDER, label: '2. Mahnung' },
              { level: ReminderLevel.FINAL_NOTICE, label: 'Letzte Mahnung' },
              { level: ReminderLevel.LEGAL_ACTION, label: 'Inkasso' }
            ].map(({ level, label }) => (
              <button
                key={level}
                type="button"
                onClick={() => setActiveTemplateLevel(level)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                  transition-all duration-200
                  ${activeTemplateLevel === level
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Template Editor */}
        <ReminderTemplateEditor
          level={activeTemplateLevel}
          template={
            getValues(`reminderSettings.templates.${activeTemplateLevel}`) || {
              subject: '',
              body: '',
              attachOriginalInvoice: true,
              includeLegalText: false
            }
          }
          onChange={(template) => {
            setValue(`reminderSettings.templates.${activeTemplateLevel}`, template);
          }}
          onReset={() => {
            // Reset to default template from settings
            const defaultTemplate = settings?.reminderSettings?.templates?.[activeTemplateLevel];
            if (defaultTemplate) {
              setValue(`reminderSettings.templates.${activeTemplateLevel}`, defaultTemplate);
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Einstellungen
        </h1>
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span>Gespeichert</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>Fehler beim Speichern</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      transition-all duration-200 flex items-center gap-2
                      ${isActive
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'company' && renderCompanyTab()}
            {activeTab === 'bank' && renderBankTab()}
            {activeTab === 'invoice' && renderInvoiceTab()}
            {activeTab === 'reminders' && renderRemindersTab()}
            {activeTab === 'templates' && renderTemplatesTab()}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => reset(settings)}
            className="btn-secondary"
          >
            Zurücksetzen
          </button>
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="btn-primary flex items-center gap-2"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                Speichern...
              </>
            ) : (
              'Einstellungen speichern'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;