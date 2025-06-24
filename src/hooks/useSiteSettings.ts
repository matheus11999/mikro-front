import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SiteSetting {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'file';
  category: string;
  label: string;
  description: string;
  is_public: boolean;
}

interface SiteSettings {
  [key: string]: string | number | boolean | object;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_public', true);

      if (fetchError) {
        throw fetchError;
      }

      // Converter para objeto chave-valor com tipos apropriados
      const settingsObj = (data || []).reduce((acc, setting: SiteSetting) => {
        let value: any = setting.value;
        
        // Converter tipos
        switch (setting.type) {
          case 'number':
            value = Number(value) || 0;
            break;
          case 'boolean':
            value = value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch {
              value = {};
            }
            break;
          default:
            // string e file permanecem como string
            break;
        }

        acc[setting.key] = value;
        return acc;
      }, {} as SiteSettings);

      setSettings(settingsObj);
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Função helper para obter uma configuração específica
  const getSetting = (key: string, defaultValue: any = '') => {
    return settings[key] ?? defaultValue;
  };

  // Função helper para obter configurações de uma categoria
  const getSettingsByCategory = (category: string) => {
    return Object.entries(settings).filter(([key]) => 
      key.startsWith(category + '_')
    );
  };

  return {
    settings,
    loading,
    error,
    getSetting,
    getSettingsByCategory,
    reload: loadSettings
  };
} 