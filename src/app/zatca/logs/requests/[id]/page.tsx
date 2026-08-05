'use client';

import { useAuthStore } from '@/store/authStore';
import { useZatcaRequestLogDetail } from '@/hooks/api/useZatca';
import RecordDetailShell from '@/components/record-detail/RecordDetailShell';
import { ZatcaLookupTag, formatDateTime } from '../../../_lib/zatcaDisplay';
import styles from '../../../zatca.module.css';

const LIST_ROUTE = '/zatca/logs';

function isNotFoundError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | undefined)?.response?.status === 404;
}

export default function ZatcaRequestLogDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const language = useAuthStore((state) => state.language);
  const branchId = useAuthStore((state) => state.branchId);
  const isAr = language !== 'en';
  const t = (ar: string, en: string) => (isAr ? ar : en);

  const { data: log, isLoading, isError, error, refetch } = useZatcaRequestLogDetail(id, branchId ?? undefined);

  const notFound = isError && isNotFoundError(error);
  const genericError = isError && !notFound;

  return (
    <RecordDetailShell
      loading={isLoading}
      error={genericError ? error : undefined}
      notFound={notFound}
      onRetry={() => refetch()}
      breadcrumbs={[
        { label: t('السجلات', 'Logs'), href: LIST_ROUTE },
        { label: t('تفاصيل الطلب', 'Request Detail') },
      ]}
      backHref={LIST_ROUTE}
      title={t('تفاصيل طلب API', 'API Request Detail')}
      status={log && <ZatcaLookupTag category="apiRequestTypes" value={log.requestType} />}
    >
      {log && (
        <>
          <div className={styles.facts}>
            <div className={styles.factItem}>
              <div className={styles.factLabel}>{t('الطريقة', 'Method')}</div>
              <div className={styles.factValue}>{log.httpMethod || '—'}</div>
            </div>
            <div className={styles.factItem}>
              <div className={styles.factLabel}>{t('نقطة النهاية', 'Endpoint')}</div>
              <div className={styles.factValue} style={{ fontSize: 12.5, wordBreak: 'break-all' }}>{log.endpointUrl || '—'}</div>
            </div>
            <div className={styles.factItem}>
              <div className={styles.factLabel}>{t('البيئة', 'Environment')}</div>
              <div className={styles.factValue}><ZatcaLookupTag category="environments" value={log.environment} /></div>
            </div>
            <div className={styles.factItem}>
              <div className={styles.factLabel}>{t('معرف الارتباط', 'Correlation ID')}</div>
              <div className={styles.factValue} style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.correlationId || '—'}</div>
            </div>
            <div className={styles.factItem}>
              <div className={styles.factLabel}>{t('المدة', 'Duration')}</div>
              <div className={styles.factValue}>{log.durationMs != null ? `${log.durationMs} ms` : '—'}</div>
            </div>
            <div className={styles.factItem}>
              <div className={styles.factLabel}>{t('تاريخ الطلب', 'Requested At')}</div>
              <div className={styles.factValue}>{formatDateTime(log.requestedAt)}</div>
            </div>
          </div>

          <div className={styles.sectionTitle}>{t('الطلب', 'Request')}</div>
          {log.requestHeaders && (
            <>
              <div className={styles.factLabel}>{t('الترويسات', 'Headers')}</div>
              <pre className={styles.codeBlock}>{log.requestHeaders}</pre>
            </>
          )}
          {log.requestBody && (
            <>
              <div className={styles.factLabel} style={{ marginTop: 8 }}>{t('النص', 'Body')}</div>
              <pre className={styles.codeBlock}>{log.requestBody}</pre>
            </>
          )}

          {log.response && (
            <>
              <div className={styles.sectionTitle}>{t('الاستجابة', 'Response')}</div>
              <div className={styles.facts}>
                <div className={styles.factItem}>
                  <div className={styles.factLabel}>{t('رمز الحالة', 'HTTP Status')}</div>
                  <div className={styles.factValue}>{log.response.httpStatusCode}</div>
                </div>
                <div className={styles.factItem}>
                  <div className={styles.factLabel}>{t('ناجح', 'Success')}</div>
                  <div className={styles.factValue}>{log.response.isSuccess ? t('نعم', 'Yes') : t('لا', 'No')}</div>
                </div>
                <div className={styles.factItem}>
                  <div className={styles.factLabel}>{t('رمز الخطأ', 'Error Code')}</div>
                  <div className={styles.factValue}>{log.response.errorCode || '—'}</div>
                </div>
                <div className={styles.factItem}>
                  <div className={styles.factLabel}>{t('وقت الاستلام', 'Received At')}</div>
                  <div className={styles.factValue}>{formatDateTime(log.response.receivedAt)}</div>
                </div>
              </div>
              {log.response.errorMessage && (
                <div className={styles.readOnlyNote} style={{ borderColor: '#ff4d4f', color: '#a8071a', background: '#fff1f0' }}>
                  {log.response.errorMessage}
                </div>
              )}
              {log.response.responseBody && (
                <>
                  <div className={styles.factLabel}>{t('نص الاستجابة', 'Response Body')}</div>
                  <pre className={styles.codeBlock}>{log.response.responseBody}</pre>
                </>
              )}
            </>
          )}
        </>
      )}
    </RecordDetailShell>
  );
}
