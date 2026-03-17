"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
  flagUrl: string;
};

type PhoneInputWithCountryProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  inputClassName?: string;
};

const FALLBACK_COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flagUrl: 'https://flagcdn.com/24x18/us.png' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flagUrl: 'https://flagcdn.com/24x18/gb.png' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flagUrl: 'https://flagcdn.com/24x18/za.png' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flagUrl: 'https://flagcdn.com/24x18/zw.png' },
  { code: 'IN', name: 'India', dialCode: '+91', flagUrl: 'https://flagcdn.com/24x18/in.png' },
];

let countriesCache: CountryOption[] | null = null;
let countriesRequest: Promise<CountryOption[]> | null = null;

const parseCountries = (rows: any[]): CountryOption[] => {
  const parsed = rows
    .map((row) => {
      const root = row?.idd?.root;
      const suffixes: string[] = row?.idd?.suffixes || [];
      const dialCode = root && suffixes.length > 0 ? `${root}${suffixes[0]}` : null;
      const code = String(row?.cca2 || '').toUpperCase();

      if (!code || !dialCode) {
        return null;
      }

      return {
        code,
        name: String(row?.name?.common || code),
        dialCode,
        flagUrl: `https://flagcdn.com/24x18/${code.toLowerCase()}.png`,
      } as CountryOption;
    })
    .filter(Boolean) as CountryOption[];

  const deduped = Array.from(new Map(parsed.map((country) => [country.code, country])).values());
  deduped.sort((a, b) => a.name.localeCompare(b.name));

  return deduped.length > 0 ? deduped : FALLBACK_COUNTRIES;
};

const loadCountries = async (): Promise<CountryOption[]> => {
  if (countriesCache) {
    return countriesCache;
  }

  if (!countriesRequest) {
    countriesRequest = fetch('https://restcountries.com/v3.1/all?fields=cca2,name,idd')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Country list request failed');
        }
        const json = await res.json();
        return parseCountries(Array.isArray(json) ? json : []);
      })
      .catch(() => FALLBACK_COUNTRIES)
      .then((list) => {
        countriesCache = list;
        return list;
      });
  }

  return countriesRequest;
};

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '');

const splitPhone = (value: string, countries: CountryOption[]) => {
  const normalized = normalizePhone(value || '');

  if (!normalized.startsWith('+')) {
    return { dialCode: '+1', localNumber: normalized };
  }

  const sortedByDialLength = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const matched = sortedByDialLength.find((country) => normalized.startsWith(country.dialCode));

  if (!matched) {
    return { dialCode: '+1', localNumber: normalized.replace(/^\+/, '') };
  }

  return {
    dialCode: matched.dialCode,
    localNumber: normalized.slice(matched.dialCode.length).replace(/\D/g, ''),
  };
};

const PhoneInputWithCountry = ({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = '771234567',
  className = '',
  selectClassName = '',
  inputClassName = '',
}: PhoneInputWithCountryProps) => {
  const [countries, setCountries] = useState<CountryOption[]>(FALLBACK_COUNTRIES);
  const [dialCode, setDialCode] = useState('+1');
  const [localNumber, setLocalNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('US');
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadCountries().then((list) => {
      if (!isMounted) {
        return;
      }
      setCountries(list);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const parsed = splitPhone(value || '', countries);
    const currentCountry = countries.find((country) => country.code === selectedCountryCode);

    setLocalNumber(parsed.localNumber);

    if (currentCountry && currentCountry.dialCode === parsed.dialCode) {
      setDialCode(parsed.dialCode);
      return;
    }

    const matchedCountry = countries.find((country) => country.dialCode === parsed.dialCode);
    setDialCode(parsed.dialCode);
    setSelectedCountryCode(matchedCountry?.code || countries[0]?.code || 'US');
  }, [value, countries, selectedCountryCode]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return countries;
    }

    return countries.filter((country) =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.includes(query)
    );
  }, [countries, search]);

  const selectedCountry = countries.find((country) => country.code === selectedCountryCode) || countries[0] || FALLBACK_COUNTRIES[0];

  const emitValue = (nextDialCode: string, nextLocalNumber: string) => {
    const cleanLocal = nextLocalNumber.replace(/\D/g, '');
    if (!cleanLocal) {
      onChange('');
      return;
    }
    onChange(`${nextDialCode}${cleanLocal}`);
  };

  const handleCountrySelect = (country: CountryOption) => {
    setSelectedCountryCode(country.code);
    setDialCode(country.dialCode);
    emitValue(country.dialCode, localNumber);
    setIsOpen(false);
    setSearch('');
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const clean = event.target.value.replace(/\D/g, '');
    setLocalNumber(clean);
    emitValue(dialCode, clean);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div ref={pickerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={selectClassName || 'w-52 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'}
        >
          <span className="inline-flex items-center gap-2">
            <img src={selectedCountry.flagUrl} alt={`${selectedCountry.name} flag`} width={20} height={15} className="rounded-sm border border-slate-200" />
            <span className="truncate">{selectedCountry.dialCode} {selectedCountry.code}</span>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-80 rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <span className="inline-flex items-center gap-2">
                    <img src={country.flagUrl} alt={`${country.name} flag`} width={20} height={15} className="rounded-sm border border-slate-200" />
                    <span>{country.name}</span>
                    <span className="text-slate-500">({country.dialCode})</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        required={required}
        disabled={disabled}
        inputMode="tel"
        placeholder={placeholder}
        className={inputClassName || 'flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'}
      />
    </div>
  );
};

export default PhoneInputWithCountry;
