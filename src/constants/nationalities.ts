/**
 * Client-relevant nationalities, pinned to the top of the Customer form's
 * nationality dropdown (see NationalitySelect's `priorityNames` prop). The
 * full nationality list stays available below and via search — this is a
 * findability aid, not a restriction. Match against Arabic names since
 * that's what the feedback used; NationalitySelect matches ar/en either way.
 */
export const CUSTOMER_COMMON_NATIONALITIES = [
  'سعودي',
  'سوري',
  'مصري',
  'يمني',
  'أردني',
  'فلسطيني',
  'سوداني',
  'لبناني',
];
