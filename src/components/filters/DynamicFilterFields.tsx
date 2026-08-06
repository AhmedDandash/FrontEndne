'use client';

import { Input, InputNumber, Row, Col, Select, Switch } from 'antd';
import DateRangeFilter from './DateRangeFilter';
import TextMatchFilter, { type TextMatchValue } from './TextMatchFilter';

type OptionValue = string | number | boolean;

export interface FilterOption {
  label: string;
  value: OptionValue;
}

type BaseFilterDefinition = {
  key: string;
  label: string;
  placeholder?: string;
  span?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
};

export type DynamicFilterDefinition =
  | (BaseFilterDefinition & {
      type: 'text' | 'number';
      apiParameter: string;
    })
  | (BaseFilterDefinition & {
      type: 'text-match';
      apiParameter: string;
      matchApiParameter: string;
    })
  | (BaseFilterDefinition & {
      type: 'select';
      apiParameter: string;
      options: FilterOption[];
      mode?: 'multiple';
    })
  | (BaseFilterDefinition & {
      type: 'boolean';
      apiParameter: string;
    })
  | (BaseFilterDefinition & {
      type: 'date-range';
      fromApiParameter: string;
      toApiParameter: string;
    });

export type DynamicFilterValues = Record<string, unknown>;

export function serializeDynamicFilters(
  definitions: DynamicFilterDefinition[],
  values: DynamicFilterValues
): Record<string, string | number | boolean | string[] | number[]> {
  const params: Record<string, string | number | boolean | string[] | number[]> = {};

  const put = (param: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    params[param] = value as string | number | boolean | string[] | number[];
  };

  for (const definition of definitions) {
    const value = values[definition.key];

    if (definition.type === 'date-range') {
      const [from, to] = (Array.isArray(value) ? value : []) as [
        string | undefined,
        string | undefined,
      ];
      put(definition.fromApiParameter, from);
      put(definition.toApiParameter, to);
      continue;
    }

    if (definition.type === 'text-match') {
      const textValue = (value ?? {}) as TextMatchValue;
      put(definition.apiParameter, textValue.text);
      if (textValue.text) put(definition.matchApiParameter, textValue.mode);
      continue;
    }

    put(definition.apiParameter, value);
  }

  return params;
}

export function countDynamicFilters(
  definitions: DynamicFilterDefinition[],
  values: DynamicFilterValues
): number {
  let count = 0;

  for (const definition of definitions) {
    const value = values[definition.key];

    if (definition.type === 'date-range') {
      const [from, to] = (Array.isArray(value) ? value : []) as [
        string | undefined,
        string | undefined,
      ];
      if (from || to) count += 1;
      continue;
    }

    if (definition.type === 'text-match') {
      const textValue = (value ?? {}) as TextMatchValue;
      if (textValue.text) count += 1;
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) count += 1;
      continue;
    }

    if (value !== undefined && value !== null && value !== '') count += 1;
  }

  return count;
}

export interface DynamicFilterFieldsProps {
  definitions: DynamicFilterDefinition[];
  values: DynamicFilterValues;
  onChange: (key: string, value: unknown) => void;
  lang?: 'ar' | 'en';
}

export default function DynamicFilterFields({
  definitions,
  values,
  onChange,
  lang = 'ar',
}: DynamicFilterFieldsProps) {
  return (
    <Row gutter={[16, 16]}>
      {definitions.map((definition) => {
        const span = definition.span ?? { xs: 24, md: 12, xl: 8 };

        return (
          <Col key={definition.key} {...span}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              {definition.label}
            </label>
            {definition.type === 'text' && (
              <Input
                allowClear
                size="large"
                placeholder={definition.placeholder ?? definition.label}
                value={(values[definition.key] as string | undefined) ?? ''}
                onChange={(event) => onChange(definition.key, event.target.value || undefined)}
              />
            )}
            {definition.type === 'text-match' && (
              <TextMatchFilter
                lang={lang}
                placeholder={definition.placeholder ?? definition.label}
                value={(values[definition.key] as TextMatchValue | undefined) ?? {}}
                onChange={(value) => onChange(definition.key, value)}
              />
            )}
            {definition.type === 'number' && (
              <InputNumber
                size="large"
                style={{ width: '100%' }}
                placeholder={definition.placeholder ?? definition.label}
                value={(values[definition.key] as number | undefined) ?? null}
                onChange={(value) => onChange(definition.key, value ?? undefined)}
              />
            )}
            {definition.type === 'select' && (
              <Select
                allowClear
                showSearch
                size="large"
                mode={definition.mode}
                optionFilterProp="label"
                placeholder={definition.placeholder ?? definition.label}
                style={{ width: '100%' }}
                value={values[definition.key] as any}
                onChange={(value) => onChange(definition.key, value)}
                options={definition.options}
              />
            )}
            {definition.type === 'boolean' && (
              <Switch
                checked={values[definition.key] as boolean | undefined}
                onChange={(checked) => onChange(definition.key, checked)}
              />
            )}
            {definition.type === 'date-range' && (
              <DateRangeFilter
                value={values[definition.key] as [string | undefined, string | undefined]}
                onChange={(range) => onChange(definition.key, range)}
                style={{ width: '100%' }}
              />
            )}
          </Col>
        );
      })}
    </Row>
  );
}
