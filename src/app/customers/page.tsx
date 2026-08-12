'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Empty,
  Modal,
  Form,
  Avatar,
  Dropdown,
  Divider,
  Tag,
  Pagination,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  TeamOutlined,
  MoreOutlined,
  EyeOutlined,
  FileTextOutlined,
  SwapOutlined,
  DollarOutlined,
} from '@ant-design/icons';

import { useAuthStore } from '@/store/authStore';
import { useCustomers, useCustomersFiltered } from '@/hooks/api/useCustomers';
import { CustomerService } from '@/services';
import {
  BranchFilterSelect,
  DateRangeFilter,
  ExportButton,
  AdvancedFilterPanel,
  TextMatchFilter,
  type TextMatchValue,
} from '@/components/filters';
import { API_ENDPOINTS } from '@/config/api.config';
import type { CustomerQuery } from '@/types/filters.types';
import { useEmploymentOperatingContracts } from '@/hooks/api/useEmploymentOperatingContracts';
import { useJobs } from '@/hooks/api/useJobs';
import { useNationalities } from '@/hooks/api/useNationalities';
import NationalitySelect from '@/components/common/NationalitySelect';
import { CUSTOMER_COMMON_NATIONALITIES } from '@/constants/nationalities';
import { linkProps } from '@/lib/navigation/linkProps';
import HijriDatePicker from '@/components/common/HijriDatePicker';
import { useAgents } from '@/hooks/api/useAgents';
import { useMarketers } from '@/hooks/api/useMarketers';
import RentOfferSelector from '@/components/contracts/RentOfferSelector';
import WorkerSelect from '@/components/contracts/WorkerSelect';
import type {
  Customer,
  CustomerPhoneDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateEmploymentOperatingContractDto,
  EmploymentContractOffer,
} from '@/types/api.types';
import {
  HOUSING_TYPE,
  IDENTITY_TYPE,
  OPERATION_TYPE,
  PAYMENT_METHOD,
  PREVIOUS_EXPERIENCE,
  MARKETER_SOURCE,
  getEnumLabel,
  toSelectOptions,
} from '@/constants/enums';

// MaritalStatus values are live-verified 1-4 (backend rejects 0 with HTTP 400)
// — do NOT reuse the shared `MARITAL_STATUS` constant here, it's 0-indexed and
// wrong for this field (see spawned follow-up task).
const CUSTOMER_MARITAL_STATUS = [
  { value: 1, labelAr: 'أعزب', labelEn: 'Single' },
  { value: 2, labelAr: 'متزوج', labelEn: 'Married' },
  { value: 3, labelAr: 'مطلق', labelEn: 'Divorced' },
  { value: 4, labelAr: 'أرمل', labelEn: 'Widowed' },
] as const;

// StringMatchMode, live-verified against /api/V1/Customer (see TextMatchFilter).
const MATCH_MODE_OPTIONS = [
  { value: 0, ar: 'يحتوي على', en: 'Contains' },
  { value: 1, ar: 'مطابقة تامة', en: 'Exact' },
  { value: 2, ar: 'يبدأ بـ', en: 'Starts with' },
  { value: 3, ar: 'ينتهي بـ', en: 'Ends with' },
] as const;
import styles from './Customers.module.css';

export default function CustomersPage() {
  // Journal Entry "Go to source" party-fallback links here with ?openId=<customerId>.
  // This page has no read-only customer detail view to auto-open (cards + edit
  // modal only), so the deep-link intentionally lands on the list; useOpenIdParam
  // is deliberately not wired.
  const router = useRouter();
  const language = useAuthStore((state) => state.language);
  const userBranchId = useAuthStore((state) => state.branchId);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  // Branch scoping + advanced filters (server-side)
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [includeSubBranches, setIncludeSubBranches] = useState(true);
  const [dateRange, setDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [string | undefined, string | undefined]
  >([undefined, undefined]);
  // Advanced filters — CustomerQuery fields not covered by quick filters.
  const [idNumberFilter, setIdNumberFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState<string | undefined>(undefined);
  const [agentIdFilter, setAgentIdFilter] = useState<string | undefined>(undefined);
  const [marketerIdFilter, setMarketerIdFilter] = useState<string | undefined>(undefined);
  // Numeric range + date range advanced filters (gap-audit addition).
  const [monthlyIncomeMin, setMonthlyIncomeMin] = useState<number | undefined>(undefined);
  const [monthlyIncomeMax, setMonthlyIncomeMax] = useState<number | undefined>(undefined);
  const [familyMembersMin, setFamilyMembersMin] = useState<number | undefined>(undefined);
  const [familyMembersMax, setFamilyMembersMax] = useState<number | undefined>(undefined);
  const [childrenCountMin, setChildrenCountMin] = useState<number | undefined>(undefined);
  const [childrenCountMax, setChildrenCountMax] = useState<number | undefined>(undefined);
  const [birthDateRange, setBirthDateRange] = useState<[string | undefined, string | undefined]>([
    undefined,
    undefined,
  ]);
  const [identityIssueDateRange, setIdentityIssueDateRange] = useState<
    [string | undefined, string | undefined]
  >([undefined, undefined]);
  // Match-mode for the 3 pre-existing quick text filters (see TextMatchFilter).
  const [idNumberMatch, setIdNumberMatch] = useState<number | undefined>(undefined);
  const [mobileMatch, setMobileMatch] = useState<number | undefined>(undefined);
  const [emailMatch, setEmailMatch] = useState<number | undefined>(undefined);
  const [nationalityMatch, setNationalityMatch] = useState<number | undefined>(undefined);
  // Text fields + enums with no filter UI at all yet (follow-up gap audit).
  const [arabicNameFilter, setArabicNameFilter] = useState<TextMatchValue>({});
  const [englishNameFilter, setEnglishNameFilter] = useState<TextMatchValue>({});
  const [usernameFilter, setUsernameFilter] = useState<TextMatchValue>({});
  const [nationalIdFilter, setNationalIdFilter] = useState<TextMatchValue>({});
  const [identityNumberFilter, setIdentityNumberFilter] = useState<TextMatchValue>({});
  const [identityTypeFilter, setIdentityTypeFilter] = useState<number | undefined>(undefined);
  const [secondaryMobileFilter, setSecondaryMobileFilter] = useState<TextMatchValue>({});
  const [maritalStatusFilter, setMaritalStatusFilter] = useState<number | undefined>(undefined);
  const [housingTypeFilter, setHousingTypeFilter] = useState<number | undefined>(undefined);
  const [cityArFilter, setCityArFilter] = useState<TextMatchValue>({});
  const [cityEnFilter, setCityEnFilter] = useState<TextMatchValue>({});
  const [districtArFilter, setDistrictArFilter] = useState<TextMatchValue>({});
  const [districtEnFilter, setDistrictEnFilter] = useState<TextMatchValue>({});
  const [addressArFilter, setAddressArFilter] = useState<TextMatchValue>({});
  const [addressEnFilter, setAddressEnFilter] = useState<TextMatchValue>({});
  const [taxNumberFilter, setTaxNumberFilter] = useState<TextMatchValue>({});
  const [ibanFilter, setIbanFilter] = useState<TextMatchValue>({});
  const [bankNameFilter, setBankNameFilter] = useState<TextMatchValue>({});
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  // Contract creation modal
  const [isContractModalVisible, setIsContractModalVisible] = useState(false);
  const [selectedCustomerForContract, setSelectedCustomerForContract] = useState<Customer | null>(
    null
  );
  const [contractSelectedOffer, setContractSelectedOffer] =
    useState<EmploymentContractOffer | null>(null);
  const [contractForm] = Form.useForm();

  // Mutations (create/update/delete) come from the base hook.
  const {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomers();

  // Debounce the search box → server-side `search`, and reset to page 1.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPageNumber(1);
    }, 400);
    return () => clearTimeout(id);
  }, [searchText]);

  // Debounce the free-text advanced filters (idNumber/mobile/email) the same way.
  const [debouncedIdNumber, setDebouncedIdNumber] = useState('');
  const [debouncedMobile, setDebouncedMobile] = useState('');
  const [debouncedEmail, setDebouncedEmail] = useState('');
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedIdNumber(idNumberFilter.trim());
      setDebouncedMobile(mobileFilter.trim());
      setDebouncedEmail(emailFilter.trim());
      setPageNumber(1);
    }, 400);
    return () => clearTimeout(id);
  }, [idNumberFilter, mobileFilter, emailFilter]);

  const query: CustomerQuery = useMemo(
    () => ({
      branchId,
      includeSubBranches: branchId ? includeSubBranches : undefined,
      search: debouncedSearch || undefined,
      createdDateFrom: dateRange[0],
      createdDateTo: dateRange[1],
      updatedDateFrom: updatedDateRange[0],
      updatedDateTo: updatedDateRange[1],
      idNumber: debouncedIdNumber || undefined,
      idNumberMatch,
      mobile: debouncedMobile || undefined,
      mobileMatch,
      email: debouncedEmail || undefined,
      emailMatch,
      nationality: nationalityFilter || undefined,
      nationalityMatch,
      agentId: agentIdFilter || undefined,
      marketerId: marketerIdFilter || undefined,
      monthlyIncomeMin,
      monthlyIncomeMax,
      familyMembersMin,
      familyMembersMax,
      childrenCountMin,
      childrenCountMax,
      birthDateFrom: birthDateRange[0],
      birthDateTo: birthDateRange[1],
      identityIssueDateFrom: identityIssueDateRange[0],
      identityIssueDateTo: identityIssueDateRange[1],
      arabicName: arabicNameFilter.text,
      arabicNameMatch: arabicNameFilter.mode,
      englishName: englishNameFilter.text,
      englishNameMatch: englishNameFilter.mode,
      username: usernameFilter.text,
      usernameMatch: usernameFilter.mode,
      nationalId: nationalIdFilter.text,
      nationalIdMatch: nationalIdFilter.mode,
      identityNumber: identityNumberFilter.text,
      identityNumberMatch: identityNumberFilter.mode,
      identityType: identityTypeFilter,
      secondaryMobileNumber: secondaryMobileFilter.text,
      secondaryMobileNumberMatch: secondaryMobileFilter.mode,
      maritalStatus: maritalStatusFilter,
      housingType: housingTypeFilter,
      cityAr: cityArFilter.text,
      cityArMatch: cityArFilter.mode,
      cityEn: cityEnFilter.text,
      cityEnMatch: cityEnFilter.mode,
      districtAr: districtArFilter.text,
      districtArMatch: districtArFilter.mode,
      districtEn: districtEnFilter.text,
      districtEnMatch: districtEnFilter.mode,
      addressAr: addressArFilter.text,
      addressArMatch: addressArFilter.mode,
      addressEn: addressEnFilter.text,
      addressEnMatch: addressEnFilter.mode,
      taxNumber: taxNumberFilter.text,
      taxNumberMatch: taxNumberFilter.mode,
      iban: ibanFilter.text,
      ibanMatch: ibanFilter.mode,
      bankName: bankNameFilter.text,
      bankNameMatch: bankNameFilter.mode,
      pageNumber,
      pageSize,
    }),
    [
      branchId,
      includeSubBranches,
      debouncedSearch,
      dateRange,
      updatedDateRange,
      debouncedIdNumber,
      idNumberMatch,
      debouncedMobile,
      mobileMatch,
      debouncedEmail,
      emailMatch,
      nationalityFilter,
      nationalityMatch,
      agentIdFilter,
      marketerIdFilter,
      monthlyIncomeMin,
      monthlyIncomeMax,
      familyMembersMin,
      familyMembersMax,
      childrenCountMin,
      childrenCountMax,
      birthDateRange,
      identityIssueDateRange,
      arabicNameFilter,
      englishNameFilter,
      usernameFilter,
      nationalIdFilter,
      identityNumberFilter,
      identityTypeFilter,
      secondaryMobileFilter,
      maritalStatusFilter,
      housingTypeFilter,
      cityArFilter,
      cityEnFilter,
      districtArFilter,
      districtEnFilter,
      addressArFilter,
      addressEnFilter,
      taxNumberFilter,
      ibanFilter,
      bankNameFilter,
      pageNumber,
      pageSize,
    ]
  );

  // Server-side filtered + paginated list.
  const { customers, total, isLoading, isFetching } = useCustomersFiltered(query);

  // Count of active advanced filters (for the panel badge / clear button).
  const activeFilterCount =
    (branchId ? 1 : 0) +
    (dateRange[0] || dateRange[1] ? 1 : 0) +
    (updatedDateRange[0] || updatedDateRange[1] ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0) +
    (idNumberFilter ? 1 : 0) +
    (mobileFilter ? 1 : 0) +
    (emailFilter ? 1 : 0) +
    (nationalityFilter ? 1 : 0) +
    (agentIdFilter ? 1 : 0) +
    (marketerIdFilter ? 1 : 0) +
    (monthlyIncomeMin !== undefined ? 1 : 0) +
    (monthlyIncomeMax !== undefined ? 1 : 0) +
    (familyMembersMin !== undefined ? 1 : 0) +
    (familyMembersMax !== undefined ? 1 : 0) +
    (childrenCountMin !== undefined ? 1 : 0) +
    (childrenCountMax !== undefined ? 1 : 0) +
    (birthDateRange[0] || birthDateRange[1] ? 1 : 0) +
    (identityIssueDateRange[0] || identityIssueDateRange[1] ? 1 : 0) +
    [
      arabicNameFilter,
      englishNameFilter,
      usernameFilter,
      nationalIdFilter,
      identityNumberFilter,
      secondaryMobileFilter,
      cityArFilter,
      cityEnFilter,
      districtArFilter,
      districtEnFilter,
      addressArFilter,
      addressEnFilter,
      taxNumberFilter,
      ibanFilter,
      bankNameFilter,
    ].filter((v) => v.text || v.mode !== undefined).length +
    (identityTypeFilter !== undefined ? 1 : 0) +
    (maritalStatusFilter !== undefined ? 1 : 0) +
    (housingTypeFilter !== undefined ? 1 : 0);

  const clearFilters = () => {
    setBranchId(undefined);
    setIncludeSubBranches(true);
    setDateRange([undefined, undefined]);
    setUpdatedDateRange([undefined, undefined]);
    setCityFilter('all');
    setIdNumberFilter('');
    setMobileFilter('');
    setEmailFilter('');
    setNationalityFilter(undefined);
    setAgentIdFilter(undefined);
    setMarketerIdFilter(undefined);
    setMonthlyIncomeMin(undefined);
    setMonthlyIncomeMax(undefined);
    setFamilyMembersMin(undefined);
    setFamilyMembersMax(undefined);
    setChildrenCountMin(undefined);
    setChildrenCountMax(undefined);
    setBirthDateRange([undefined, undefined]);
    setIdentityIssueDateRange([undefined, undefined]);
    setIdNumberMatch(undefined);
    setMobileMatch(undefined);
    setEmailMatch(undefined);
    setNationalityMatch(undefined);
    setArabicNameFilter({});
    setEnglishNameFilter({});
    setUsernameFilter({});
    setNationalIdFilter({});
    setIdentityNumberFilter({});
    setIdentityTypeFilter(undefined);
    setSecondaryMobileFilter({});
    setMaritalStatusFilter(undefined);
    setHousingTypeFilter(undefined);
    setCityArFilter({});
    setCityEnFilter({});
    setDistrictArFilter({});
    setDistrictEnFilter({});
    setAddressArFilter({});
    setAddressEnFilter({});
    setTaxNumberFilter({});
    setIbanFilter({});
    setBankNameFilter({});
    setPageNumber(1);
  };

  // Employment operating contracts API
  const { createContract, isCreating: isCreatingContract } = useEmploymentOperatingContracts();

  // Jobs API
  const { data: jobsData, isLoading: isLoadingJobs } = useJobs();

  // Nationalities API — customer dropdown shows active nationalities only.
  const { data: nationalitiesData = [] } = useNationalities({ isActiveOnly: true, pageSize: 100 });

  // Agents/Marketers — for the advanced-filter dropdowns below.
  const { data: agentsData = [] } = useAgents();
  const { data: marketersData = [] } = useMarketers();

  // English-name auto-generation (from the Arabic name) state.
  const [isGeneratingName, setIsGeneratingName] = useState(false);

  const nationalities = useMemo(() => {
    const raw = Array.isArray(nationalitiesData)
      ? nationalitiesData
      : (nationalitiesData as any)?.$values;
    return Array.isArray(raw) ? raw : [];
  }, [nationalitiesData]);

  const getNationalityLabel = (n: any) => {
    if (language === 'ar') {
      return n?.nationalityNameAr || n?.nationalityName || n?.name || '-';
    }
    return n?.nationalityNameEn || n?.nationalityName || n?.name || '-';
  };

  // Safely extract jobs array from API response and filter active jobs only
  const jobs = useMemo(() => {
    if (!jobsData) return [];
    let jobsArray: any[] = [];

    if (Array.isArray(jobsData)) {
      jobsArray = jobsData;
    } else if (
      typeof jobsData === 'object' &&
      'data' in jobsData &&
      Array.isArray((jobsData as any).data)
    ) {
      jobsArray = (jobsData as any).data;
    }

    // Filter to only include active jobs
    return jobsArray.filter((job: any) => job.isActive === true);
  }, [jobsData]);

  const t = (key: string) => {
    const translations: { [key: string]: { ar: string; en: string } } = {
      pageTitle: { ar: 'إدارة العملاء', en: 'Customer Management' },
      totalCustomers: { ar: 'إجمالي العملاء', en: 'Total Customers' },
      addCustomer: { ar: 'إضافة عميل جديد', en: 'Add New Customer' },
      searchPlaceholder: { ar: 'البحث عن عميل...', en: 'Search customer...' },
      name: { ar: 'الاسم', en: 'Name' },
      arabicName: { ar: 'الاسم بالعربي', en: 'Arabic Name' },
      englishName: { ar: 'الاسم بالإنجليزي', en: 'English Name' },
      generateNameTip: {
        ar: 'يُولّد تلقائياً من الاسم العربي — يمكنك تعديله',
        en: 'Auto-generated from the Arabic name — you can edit it',
      },
      generateNameFailed: {
        ar: 'تعذّر توليد الاسم الإنجليزي',
        en: 'Failed to generate English name',
      },
      dateOfBirth: { ar: 'تاريخ الميلاد', en: 'Date of Birth' },
      nationalId: { ar: 'رقم الهوية الوطنية', en: 'National ID' },
      secondaryMobile: { ar: 'جوال ثانوي', en: 'Secondary Mobile' },
      // identityNumber: { ar: 'رقم الهوية', en: 'Identity Number' },
      nationality: { ar: 'الجنسية', en: 'Nationality' },
      mobile: { ar: 'الجوال', en: 'Mobile' },
      city: { ar: 'المدينة', en: 'City' },
      cityAr: { ar: 'المدينة بالعربي', en: 'City (Arabic)' },
      cityEn: { ar: 'المدينة بالإنجليزي', en: 'City (English)' },
      housingType: { ar: 'نوع السكن', en: 'Housing Type' },
      contactInfo: { ar: 'معلومات الاتصال', en: 'Contact Information' },
      personalInfo: { ar: 'المعلومات الشخصية', en: 'Personal Information' },
      actions: { ar: 'الإجراءات', en: 'Actions' },
      edit: { ar: 'تعديل', en: 'Edit' },
      delete: { ar: 'حذف', en: 'Delete' },
      save: { ar: 'حفظ', en: 'Save' },
      cancel: { ar: 'إلغاء', en: 'Cancel' },
      confirmDelete: {
        ar: 'هل أنت متأكد من حذف هذا العميل؟',
        en: 'Are you sure you want to delete this customer?',
      },
      deleteTitle: { ar: 'حذف العميل', en: 'Delete Customer' },
      noCustomers: { ar: 'لا يوجد عملاء', en: 'No Customers Found' },
      allCities: { ar: 'كل المدن', en: 'All Cities' },
      active: { ar: 'نشط', en: 'Active' },
      cities: { ar: 'المدن', en: 'Cities' },
      monthlyIncomeMin: { ar: 'أقل دخل شهري', en: 'Min Monthly Income' },
      monthlyIncomeMax: { ar: 'أعلى دخل شهري', en: 'Max Monthly Income' },
      familyMembersMin: { ar: 'أقل عدد أفراد الأسرة', en: 'Min Family Members' },
      familyMembersMax: { ar: 'أعلى عدد أفراد الأسرة', en: 'Max Family Members' },
      childrenCountMin: { ar: 'أقل عدد الأطفال', en: 'Min Children Count' },
      childrenCountMax: { ar: 'أعلى عدد الأطفال', en: 'Max Children Count' },
      birthDateRange: { ar: 'تاريخ الميلاد', en: 'Birth date' },
      identityIssueDateRange: { ar: 'تاريخ إصدار الهوية', en: 'Identity issue date' },
    };
    return translations[key]?.[language] || key;
  };

  const getCustomerCityLabel = useCallback(
    (customer: Customer) => {
      return language === 'ar'
        ? (customer.cityAr || customer.cityEn || '').trim()
        : (customer.cityEn || customer.cityAr || '').trim();
    },
    [language]
  );

  useEffect(() => {
    // Reset city filter when switching language to avoid stale value mismatch.
    setCityFilter('all');
  }, [language]);

  // Name/phone search is now server-side; the city filter refines the current
  // page client-side (the backend Customer query has no city parameter).
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (cityFilter === 'all') return customers;
    return customers.filter((customer) => getCustomerCityLabel(customer) === cityFilter);
  }, [customers, cityFilter, getCustomerCityLabel]);

  // Get unique cities for filter in the active UI language
  const cities = useMemo(() => {
    if (!customers) return [];
    const citySet = new Set<string>();
    customers.forEach((c) => {
      const label = getCustomerCityLabel(c);
      if (label) citySet.add(label);
    });
    return Array.from(citySet);
  }, [customers, getCustomerCityLabel]);

  // Handler functions
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    // Default the new customer's branch to the logged-in user's branch.
    form.setFieldsValue({ branchId: userBranchId ?? undefined });
    setIsModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    // Extract primary phone (or first phone) from phones array
    const primaryPhone =
      customer.phones?.find((p) => p.isPrimary)?.phoneNumber ??
      customer.phones?.[0]?.phoneNumber ??
      '';
    // DOB may arrive as a full ISO datetime — the date input needs YYYY-MM-DD.
    const dob = (customer.dateOfBirth ?? customer.birthDate ?? '')?.slice(0, 10) || undefined;
    form.setFieldsValue({
      arabicName: customer.arabicName,
      englishName: customer.englishName,
      // identityNumber: customer.identityNumber,
      nationality: customer.nationality,
      mobile: primaryPhone,
      secondaryMobileNumber: customer.secondaryMobileNumber,
      dateOfBirth: dob,
      nationalId: customer.nationalId,
      cityAr: customer.cityAr,
      cityEn: customer.cityEn,
      housingType: customer.housingType,
    });
    setIsModalVisible(true);
  };

  /**
   * Auto-fill the English name from the Arabic name via the transliteration
   * endpoint. Only fills when the English field is empty so manual edits are
   * never overwritten. Silent no-op on empty input; toast on failure.
   */
  const handleGenerateEnglishName = async () => {
    const arabicName = (form.getFieldValue('arabicName') || '').trim();
    if (!arabicName) return;
    if ((form.getFieldValue('englishName') || '').trim()) return; // keep manual value
    try {
      setIsGeneratingName(true);
      const englishName = await CustomerService.generateEnglishName(arabicName);
      if (englishName) form.setFieldsValue({ englishName });
    } catch {
      message.error(t('generateNameFailed'));
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    Modal.confirm({
      title: t('deleteTitle'),
      content: t('confirmDelete'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okButtonProps: { danger: true },
      onOk: () => {
        if (customer.id) {
          deleteCustomer(customer.id);
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Transform mobile text field → phones array expected by the API.
      // branchId only applies to create (UpdateCustomerDto has no branch field).
      const { mobile, branchId: formBranchId, ...rest } = values;

      // PUT is a full replace (confirmed live, 2026-08-11 Customers-module
      // audit) — any field this form doesn't manage gets nulled if omitted
      // from the body. Two things the frontend already knows about an
      // existing customer aren't form inputs, so they must be re-attached
      // explicitly or every edit silently erases them:
      //  - identityNumber: deliberately hidden from this UI (commit
      //    d318c9a, "Hide identity number in the customer card") — NOT
      //    re-exposing an input for it here, just preserving whatever value
      //    it already has instead of letting an unrelated edit wipe it.
      //  - phones: this form only collects a single "mobile" string, but a
      //    customer can have multiple phone entries with different types.
      //    Rebuilding a fresh single-entry array unconditionally (as this
      //    code used to) silently dropped every phone but the primary and
      //    force-reset its type/isPrimary flags on every save. Preserve the
      //    rest, and the primary's original type, updating only the number.
      const existingPhones = editingCustomer?.phones ?? [];
      // Must match handleEditCustomer's primaryPhone selection exactly (isPrimary,
      // falling back to the first entry) — otherwise, for a customer with no phone
      // marked isPrimary, this would treat existingPhones[0] as still "other" while
      // the mobile field (seeded from that same phone) re-adds it as primary too,
      // duplicating it on every save.
      const previousPrimary = existingPhones.find((p) => p.isPrimary) ?? existingPhones[0];
      const otherPhones = existingPhones.filter((p) => p !== previousPrimary);
      const phones: CustomerPhoneDto[] | undefined = mobile
        ? [
            { phoneNumber: mobile, type: previousPrimary?.type ?? 1, isPrimary: true } as CustomerPhoneDto,
            ...otherPhones,
          ]
        : otherPhones.length > 0
          ? otherPhones
          : undefined;

      const payload = {
        ...rest,
        phones,
        ...(editingCustomer ? { identityNumber: editingCustomer.identityNumber } : {}),
      };

      // Close/reset only on success — closing immediately (the old
      // behavior) raced the request: on failure the error toast fired
      // against an already-closed, already-cleared form, losing whatever
      // the user had typed.
      const onSaved = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingCustomer(null);
      };

      if (editingCustomer && editingCustomer.id) {
        updateCustomer(
          { id: editingCustomer.id, data: payload as UpdateCustomerDto },
          { onSuccess: onSaved }
        );
      } else {
        // Create new customer — attach branch (explicit selection or user's own;
        // omitted → backend falls back to the JWT branchId).
        createCustomer(
          { ...payload, branchId: formBranchId || userBranchId || undefined } as CreateCustomerDto,
          { onSuccess: onSaved }
        );
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCreateOperationContract = (customer: Customer) => {
    setSelectedCustomerForContract(customer);
    setContractSelectedOffer(null);
    contractForm.resetFields();
    // Pre-fill customer ID and default values
    contractForm.setFieldsValue({
      customerId: customer.id,
      workersCount: 1,
      previousExperience: 0,
      operationType: 1, // Default to "Duration"
      paymentMethod: 1, // Default to "Cash"
    });
    setIsContractModalVisible(true);
  };

  const handleContractOfferSelect = (offer: EmploymentContractOffer) => {
    setContractSelectedOffer(offer);
    contractForm.setFieldsValue({
      offerId: offer.id,
      nationalityId: offer.nationalityId ?? undefined,
      jobId: offer.jobId ?? undefined,
      duration: offer.duration ?? undefined,
      cost: offer.cost ?? undefined,
      insurance: offer.insurance ?? undefined,
      offerPrice: offer.workerSalary ?? undefined,
    });
  };

  const handleContractSubmit = async () => {
    try {
      const values = await contractForm.validateFields();

      // Clean and format data - convert empty strings to null
      const cleanData: any = {};

      // Numeric fields — coerced to Number (null when empty)
      const numberFields = [
        'marketerId',
        'contractCategory',
        'operationType',
        'paymentMethod',
        'duration',
        'previousExperience',
        'offerPrice',
        'laborManagement',
        'workersCount',
        'cost',
        'insurance',
      ];

      // GUID / string-id fields — MUST NOT be Number()-coerced (they are UUIDs;
      // Number('<uuid>') → NaN → null, which silently dropped nationality/job).
      const idFields = ['offerId', 'nationalityId', 'jobId', 'workerId'];

      // Plain string fields
      const stringFields = ['workerNameEn', 'workerNameAr', 'workerPhone', 'customerAddress'];

      // Date fields
      const dateFields = ['contractStartDate', 'contractEndDate'];

      // Process number fields
      numberFields.forEach((field) => {
        if (field in values) {
          if (values[field] === '' || values[field] === undefined || values[field] === null) {
            cleanData[field] = null;
          } else {
            const num = Number(values[field]);
            cleanData[field] = isNaN(num) ? null : num;
          }
        }
      });

      // Process id fields (pass through as-is, null when empty)
      idFields.forEach((field) => {
        if (field in values) {
          cleanData[field] =
            values[field] === '' || values[field] === undefined ? null : values[field];
        }
      });

      // Process string fields
      stringFields.forEach((field) => {
        if (field in values) {
          cleanData[field] =
            values[field] === '' || values[field] === undefined ? null : String(values[field]);
        }
      });

      // Process date fields
      dateFields.forEach((field) => {
        if (values[field]) {
          try {
            const date = new Date(values[field]);
            cleanData[field] = date.toISOString();
          } catch (e) {
            cleanData[field] = null;
          }
        } else {
          cleanData[field] = null;
        }
      });

      const contractData: CreateEmploymentOperatingContractDto = {
        ...cleanData,
        customerId: selectedCustomerForContract?.id || null,
      };

      createContract(contractData, {
        onSuccess: () => {
          setIsContractModalVisible(false);
          contractForm.resetFields();
          setSelectedCustomerForContract(null);
        },
      });
    } catch (error) {
      console.error('Contract form validation failed:', error);
    }
  };

  const getActionMenu = (customer: Customer): MenuProps => ({
    items: [
      {
        key: 'view',
        label: language === 'ar' ? 'عرض التفاصيل' : 'View Details',
        icon: <EyeOutlined />,
        onClick: () => console.log('View customer:', customer.id),
      },
      {
        key: 'contracts',
        label: <a {...linkProps(`/contracts/mediationcontract?customerId=${customer.id}`, router)}>
          {language === 'ar' ? 'عقود الوساطة' : 'Mediation Contracts'}
        </a>,
        icon: <FileTextOutlined />,
      },
      {
        key: 'addMediationContract',
        label: <a {...linkProps(`/contracts/mediationcontract/add?customerId=${customer.id}`, router)}>
          {language === 'ar' ? 'إنشاء عقد وساطة' : 'Create Mediation Contract'}
        </a>,
        icon: <FileTextOutlined />,
      },
      {
        key: 'transfer',
        label: language === 'ar' ? 'عقود نقل الكفالة' : 'Transfer Contracts',
        icon: <SwapOutlined />,
        onClick: () => console.log('View transfer contracts:', customer.id),
      },
      {
        key: 'rent',
        label: <a {...linkProps(`/contracts/operation/rent?customerId=${customer.id}`, router)}>
          {language === 'ar' ? 'عقود التشغيل' : 'Operation Contracts'}
        </a>,
        icon: <FileTextOutlined />,
      },
      {
        key: 'statement',
        label: <a {...linkProps(`/contracts/operation/rent?customerId=${customer.id}`, router)}>
          {language === 'ar' ? 'كشف الحساب' : 'Account Statement'}
        </a>,
        icon: <DollarOutlined />,
      },
      { type: 'divider' },
      {
        key: 'edit',
        label: t('edit'),
        icon: <EditOutlined />,
        onClick: () => handleEditCustomer(customer),
      },
      {
        key: 'delete',
        label: t('delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteCustomer(customer),
      },
    ],
  });

  // Housing type mapping — backed by HOUSING_TYPE enum
  const getHousingType = (type: string | number | null | undefined) =>
    getEnumLabel([...HOUSING_TYPE], Number(type), language);

  // Nationality display — lookup by id from API data
  const getNationality = (nationality: string | number | null | undefined) => {
    if (!nationality) return '-';
    const id = String(nationality);
    const match = nationalities.find((n: any) => String(n.id ?? n.nationalityId ?? n.value) === id);
    if (match) return getNationalityLabel(match);
    return id;
  };

  return (
    <div className={styles.customersPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <TeamOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
              <p className={styles.pageSubtitle}>
                {t('totalCustomers')}: <strong>{total || 0}</strong>
              </p>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.addButton}
            onClick={handleAddCustomer}
            loading={isCreating}
          >
            {t('addCustomer')}
          </Button>
        </div>
      </div>

      {/* Search + branch scoping + advanced filters + export */}
      <AdvancedFilterPanel
        activeCount={activeFilterCount}
        onClear={clearFilters}
        contentLayout="block"
        quickFilters={
          <>
            <Input
              placeholder={t('searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <BranchFilterSelect
              value={branchId}
              onChange={(v) => {
                setBranchId(v);
                setPageNumber(1);
              }}
              includeSubBranches={includeSubBranches}
              onIncludeSubBranchesChange={setIncludeSubBranches}
            />
          </>
        }
        actions={
          <ExportButton
            endpoint={API_ENDPOINTS.CUSTOMERS.EXPORT}
            filters={query}
            fileName="Customers.xlsx"
          />
        }
      >
        <div className={styles.filterContent}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('city')}</label>
              <Select
                style={{ width: '100%' }}
                value={cityFilter}
                onChange={(v) => setCityFilter(v)}
                placeholder={t('city')}
              >
                <Select.Option value="all">{t('allCities')}</Select.Option>
                {cities.map((city) => (
                  <Select.Option key={city} value={city}>
                    {city}
                  </Select.Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('nationalId')}</label>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={t('nationalId')}
                  value={idNumberFilter}
                  onChange={(e) => setIdNumberFilter(e.target.value)}
                  style={{ width: '65%' }}
                  allowClear
                />
                <Select
                  value={idNumberMatch}
                  onChange={setIdNumberMatch}
                  allowClear
                  placeholder={language === 'ar' ? 'يحتوي على' : 'Contains'}
                  style={{ width: '35%' }}
                  options={MATCH_MODE_OPTIONS.map((o) => ({ value: o.value, label: o[language] }))}
                />
              </Space.Compact>
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('mobile')}</label>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={t('mobile')}
                  value={mobileFilter}
                  onChange={(e) => setMobileFilter(e.target.value)}
                  style={{ width: '65%' }}
                  allowClear
                />
                <Select
                  value={mobileMatch}
                  onChange={setMobileMatch}
                  allowClear
                  placeholder={language === 'ar' ? 'يحتوي على' : 'Contains'}
                  style={{ width: '35%' }}
                  options={MATCH_MODE_OPTIONS.map((o) => ({ value: o.value, label: o[language] }))}
                />
              </Space.Compact>
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('email')}</label>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={t('email')}
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  style={{ width: '65%' }}
                  allowClear
                />
                <Select
                  value={emailMatch}
                  onChange={setEmailMatch}
                  allowClear
                  placeholder={language === 'ar' ? 'يحتوي على' : 'Contains'}
                  style={{ width: '35%' }}
                  options={MATCH_MODE_OPTIONS.map((o) => ({ value: o.value, label: o[language] }))}
                />
              </Space.Compact>
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('nationality')}</label>
              <Select
                style={{ width: '100%' }}
                value={nationalityFilter}
                onChange={(v) => {
                  setNationalityFilter(v);
                  setPageNumber(1);
                }}
                placeholder={t('nationality')}
                allowClear
                showSearch
                optionFilterProp="label"
                options={nationalities.map((n: any) => ({
                  value: String(n.id ?? n.nationalityId ?? n.value),
                  label: getNationalityLabel(n),
                }))}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'الوكيل' : 'Agent'}
              </label>
              <Select
                style={{ width: '100%' }}
                value={agentIdFilter}
                onChange={(v) => {
                  setAgentIdFilter(v);
                  setPageNumber(1);
                }}
                placeholder={language === 'ar' ? 'الوكيل' : 'Agent'}
                allowClear
                showSearch
                optionFilterProp="label"
                options={(agentsData as any[]).map((a) => ({
                  value: String(a.id),
                  label:
                    (language === 'ar' ? a.agentNameAr : a.agentNameEn) ||
                    a.agentNameAr ||
                    a.agentNameEn ||
                    `#${a.id}`,
                }))}
              />
            </Col>

            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'المسوق' : 'Marketer'}
              </label>
              <Select
                style={{ width: '100%' }}
                value={marketerIdFilter}
                onChange={(v) => {
                  setMarketerIdFilter(v);
                  setPageNumber(1);
                }}
                placeholder={language === 'ar' ? 'المسوق' : 'Marketer'}
                allowClear
                showSearch
                optionFilterProp="label"
                options={(marketersData as any[]).map((m) => ({
                  value: String(m.id),
                  label:
                    (language === 'ar' ? m.nameAr : m.nameEn) || m.nameAr || m.nameEn || `#${m.id}`,
                }))}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'تاريخ الإنشاء' : 'Created date'}
              </label>
              <DateRangeFilter
                value={dateRange}
                onChange={(range) => {
                  setDateRange(range);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>
                {language === 'ar' ? 'تاريخ آخر تحديث' : 'Updated date'}
              </label>
              <DateRangeFilter
                value={updatedDateRange}
                onChange={(range) => {
                  setUpdatedDateRange(range);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={3}>
              <label className={styles.filterLabel}>{t('monthlyIncomeMin')}</label>
              <InputNumber
                size="large"
                min={0}
                placeholder={t('monthlyIncomeMin')}
                value={monthlyIncomeMin}
                onChange={(value) => {
                  setMonthlyIncomeMin(value ?? undefined);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <label className={styles.filterLabel}>{t('monthlyIncomeMax')}</label>
              <InputNumber
                size="large"
                min={0}
                placeholder={t('monthlyIncomeMax')}
                value={monthlyIncomeMax}
                onChange={(value) => {
                  setMonthlyIncomeMax(value ?? undefined);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <label className={styles.filterLabel}>{t('familyMembersMin')}</label>
              <InputNumber
                size="large"
                min={0}
                placeholder={t('familyMembersMin')}
                value={familyMembersMin}
                onChange={(value) => {
                  setFamilyMembersMin(value ?? undefined);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <label className={styles.filterLabel}>{t('familyMembersMax')}</label>
              <InputNumber
                size="large"
                min={0}
                placeholder={t('familyMembersMax')}
                value={familyMembersMax}
                onChange={(value) => {
                  setFamilyMembersMax(value ?? undefined);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <label className={styles.filterLabel}>{t('childrenCountMin')}</label>
              <InputNumber
                size="large"
                min={0}
                placeholder={t('childrenCountMin')}
                value={childrenCountMin}
                onChange={(value) => {
                  setChildrenCountMin(value ?? undefined);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={3}>
              <label className={styles.filterLabel}>{t('childrenCountMax')}</label>
              <InputNumber
                size="large"
                min={0}
                placeholder={t('childrenCountMax')}
                value={childrenCountMax}
                onChange={(value) => {
                  setChildrenCountMax(value ?? undefined);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t('birthDateRange')}</label>
              <DateRangeFilter
                value={birthDateRange}
                onChange={(range) => {
                  setBirthDateRange(range);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} md={12}>
              <label className={styles.filterLabel}>{t('identityIssueDateRange')}</label>
              <DateRangeFilter
                value={identityIssueDateRange}
                onChange={(range) => {
                  setIdentityIssueDateRange(range);
                  setPageNumber(1);
                }}
                style={{ width: '100%' }}
              />
            </Col>

            {/* ─── Follow-up gap audit: fields with no filter UI at all yet ─── */}
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('arabicName')}</label>
              <TextMatchFilter
                value={arabicNameFilter}
                onChange={setArabicNameFilter}
                placeholder={t('arabicName')}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('englishName')}</label>
              <TextMatchFilter
                value={englishNameFilter}
                onChange={setEnglishNameFilter}
                placeholder={t('englishName')}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
              <TextMatchFilter
                value={usernameFilter}
                onChange={setUsernameFilter}
                placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              {/* Distinct from the pre-existing "IdNumber" filter above (also
                  labelled "National ID") — this is the separate `NationalId`
                  API param, disambiguated here since both mean similar things
                  in plain English/Arabic but are different backend fields. */}
              <label className={styles.filterLabel}>{language === 'ar' ? 'الرقم الوطني (NationalId)' : 'National ID (NationalId)'}</label>
              <TextMatchFilter
                value={nationalIdFilter}
                onChange={setNationalIdFilter}
                placeholder={language === 'ar' ? 'الرقم الوطني' : 'NationalId'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'رقم الهوية' : 'Identity Number'}</label>
              <TextMatchFilter
                value={identityNumberFilter}
                onChange={setIdentityNumberFilter}
                placeholder={language === 'ar' ? 'رقم الهوية' : 'Identity Number'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'نوع الهوية' : 'Identity Type'}</label>
              <Select
                style={{ width: '100%' }}
                value={identityTypeFilter}
                onChange={(v) => { setIdentityTypeFilter(v); setPageNumber(1); }}
                placeholder={language === 'ar' ? 'نوع الهوية' : 'Identity Type'}
                allowClear
                options={IDENTITY_TYPE.map((o) => ({ value: o.value, label: language === 'ar' ? o.labelAr : o.labelEn }))}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{t('secondaryMobile')}</label>
              <TextMatchFilter
                value={secondaryMobileFilter}
                onChange={setSecondaryMobileFilter}
                placeholder={t('secondaryMobile')}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'الحالة الاجتماعية' : 'Marital Status'}</label>
              <Select
                style={{ width: '100%' }}
                value={maritalStatusFilter}
                onChange={(v) => { setMaritalStatusFilter(v); setPageNumber(1); }}
                placeholder={language === 'ar' ? 'الحالة الاجتماعية' : 'Marital Status'}
                allowClear
                options={CUSTOMER_MARITAL_STATUS.map((o) => ({ value: o.value, label: language === 'ar' ? o.labelAr : o.labelEn }))}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'نوع السكن' : 'Housing Type'}</label>
              <Select
                style={{ width: '100%' }}
                value={housingTypeFilter}
                onChange={(v) => { setHousingTypeFilter(v); setPageNumber(1); }}
                placeholder={language === 'ar' ? 'نوع السكن' : 'Housing Type'}
                allowClear
                options={HOUSING_TYPE.map((o) => ({ value: o.value, label: language === 'ar' ? o.labelAr : o.labelEn }))}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'المدينة (عربي)' : 'City (Arabic)'}</label>
              <TextMatchFilter
                value={cityArFilter}
                onChange={setCityArFilter}
                placeholder={language === 'ar' ? 'المدينة (عربي)' : 'City (Arabic)'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'المدينة (إنجليزي)' : 'City (English)'}</label>
              <TextMatchFilter
                value={cityEnFilter}
                onChange={setCityEnFilter}
                placeholder={language === 'ar' ? 'المدينة (إنجليزي)' : 'City (English)'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'الحي (عربي)' : 'District (Arabic)'}</label>
              <TextMatchFilter
                value={districtArFilter}
                onChange={setDistrictArFilter}
                placeholder={language === 'ar' ? 'الحي (عربي)' : 'District (Arabic)'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'الحي (إنجليزي)' : 'District (English)'}</label>
              <TextMatchFilter
                value={districtEnFilter}
                onChange={setDistrictEnFilter}
                placeholder={language === 'ar' ? 'الحي (إنجليزي)' : 'District (English)'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'}</label>
              <TextMatchFilter
                value={addressArFilter}
                onChange={setAddressArFilter}
                placeholder={language === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'العنوان (إنجليزي)' : 'Address (English)'}</label>
              <TextMatchFilter
                value={addressEnFilter}
                onChange={setAddressEnFilter}
                placeholder={language === 'ar' ? 'العنوان (إنجليزي)' : 'Address (English)'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'الرقم الضريبي' : 'Tax Number'}</label>
              <TextMatchFilter
                value={taxNumberFilter}
                onChange={setTaxNumberFilter}
                placeholder={language === 'ar' ? 'الرقم الضريبي' : 'Tax Number'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'الآيبان' : 'IBAN'}</label>
              <TextMatchFilter
                value={ibanFilter}
                onChange={setIbanFilter}
                placeholder={language === 'ar' ? 'الآيبان' : 'IBAN'}
                lang={language}
              />
            </Col>
            <Col xs={24} md={6}>
              <label className={styles.filterLabel}>{language === 'ar' ? 'اسم البنك' : 'Bank Name'}</label>
              <TextMatchFilter
                value={bankNameFilter}
                onChange={setBankNameFilter}
                placeholder={language === 'ar' ? 'اسم البنك' : 'Bank Name'}
                lang={language}
              />
            </Col>
          </Row>
        </div>
      </AdvancedFilterPanel>

      {/* Stats Overview */}
      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={12}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#E3F2FD' }}>
                <TeamOutlined style={{ color: '#00478C', fontSize: '24px' }} />
              </div>
              <div
                className={styles.statInfo}
                style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
              >
                <p className={styles.statLabel}>{t('totalCustomers')}</p>
                <h3 className={styles.statValue}>{total || 0}</h3>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: '#FFF3E0' }}>
                <EnvironmentOutlined style={{ color: '#F59E0B', fontSize: '24px' }} />
              </div>
              <div
                className={styles.statInfo}
                style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
              >
                <p className={styles.statLabel}>{t('cities')}</p>
                <h3 className={styles.statValue}>{cities.length}</h3>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customers Grid */}
      {isLoading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : filteredCustomers.length > 0 ? (
        <Row gutter={[24, 24]} className={styles.customerGrid}>
          {filteredCustomers.map((customer) => (
            <Col xs={24} lg={12} key={customer.id}>
              <Card className={styles.customerCard} hoverable>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.customerHeaderLeft}>
                    <Avatar size={64} icon={<UserOutlined />} className={styles.customerAvatar} />
                    <div className={styles.customerNameSection}>
                      <h3 className={styles.customerName}>
                        {language === 'ar'
                          ? customer.arabicName
                          : customer.englishName || customer.arabicName}
                      </h3>
                      {customer.englishName && customer.arabicName && (
                        <p style={{ margin: 0, fontSize: 13, color: '#888', fontWeight: 400 }}>
                          {language === 'ar' ? customer.englishName : customer.arabicName}
                        </p>
                      )}
                    </div>
                  </div>
                  <Dropdown menu={getActionMenu(customer)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} className={styles.actionButton} />
                  </Dropdown>
                </div>

                {/* Card Content */}
                <div className={styles.cardContent}>
                  {/* Identity Number */}
                  {/* {customer.identityNumber && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <IdcardOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('identityNumber')}</p>
                        <p className={styles.infoValue}>{customer.identityNumber}</p>
                      </div>
                    </div>
                  )} */}

                  {/* National ID */}
                  {customer.nationalId && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <IdcardOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('nationalId')}</p>
                        <p className={styles.infoValue}>{customer.nationalId}</p>
                      </div>
                    </div>
                  )}

                  {/* Contact Information — from phones array */}
                  {customer.phones && customer.phones.length > 0 && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <PhoneOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('mobile')}</p>
                        <p className={styles.infoValue}>
                          {(customer.phones.find((p) => p.isPrimary) ?? customer.phones[0])
                            .phoneNumber || '-'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Secondary Mobile */}
                  {customer.secondaryMobileNumber && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <PhoneOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('secondaryMobile')}</p>
                        <p className={styles.infoValue}>{customer.secondaryMobileNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* City */}
                  {(customer.cityAr || customer.cityEn) && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <EnvironmentOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('city')}</p>
                        <p className={styles.infoValue}>{getCustomerCityLabel(customer)}</p>
                      </div>
                    </div>
                  )}

                  {/* Housing Type */}
                  {customer.housingType && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <HomeOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('housingType')}</p>
                        <p className={styles.infoValue}>{getHousingType(customer.housingType)}</p>
                      </div>
                    </div>
                  )}

                  {/* Nationality */}
                  {customer.nationality && (
                    <div className={styles.infoRow}>
                      <div className={styles.infoIcon}>
                        <IdcardOutlined />
                      </div>
                      <div className={styles.infoContent}>
                        <p className={styles.infoLabel}>{t('nationality')}</p>
                        <p className={styles.infoValue}>{getNationality(customer.nationality)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className={styles.cardFooter}>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    {...linkProps(`/contracts/mediationcontract/add?customerId=${customer.id}`, router)}
                    style={{
                      marginRight: language === 'ar' ? 0 : 8,
                      marginLeft: language === 'ar' ? 8 : 0,
                    }}
                  >
                    {language === 'ar' ? 'إنشاء عقد وساطة' : 'Create Mediation Contract'}
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() => handleCreateOperationContract(customer)}
                    style={{
                      marginRight: language === 'ar' ? 0 : 8,
                      marginLeft: language === 'ar' ? 8 : 0,
                    }}
                  >
                    {language === 'ar' ? 'إنشاء عقد تشغيل' : 'Create Operation Contract'}
                  </Button>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditCustomer(customer)}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteCustomer(customer)}
                    loading={isDeleting}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description={t('noCustomers')} />
      )}

      {/* Server-side pagination */}
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={pageNumber}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={[12, 24, 48, 96]}
            disabled={isFetching}
            onChange={(p, size) => {
              setPageNumber(p);
              setPageSize(size);
            }}
            showTotal={(t) => `${t}`}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingCustomer ? t('edit') : t('addCustomer')}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingCustomer(null);
        }}
        confirmLoading={isCreating || isUpdating}
        okText={t('save')}
        cancelText={t('cancel')}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('arabicName')}
                name="arabicName"
                rules={[{ required: true, message: 'Please enter Arabic name' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={t('arabicName')}
                  onBlur={handleGenerateEnglishName}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('englishName')}
                name="englishName"
                tooltip={t('generateNameTip')}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={t('englishName')}
                  suffix={isGeneratingName ? <Spin size="small" /> : null}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* <Form.Item
            label={t('identityNumber')}
            name="identityNumber"
            rules={[{ required: true, message: 'Please enter identity number' }]}
          >
            <Input prefix={<IdcardOutlined />} placeholder={t('identityNumber')} />
          </Form.Item> */}

          <Form.Item
            label={t('nationality')}
            name="nationality"
            rules={[{ required: true, message: 'Please select nationality' }]}
          >
            <NationalitySelect
              isActiveOnly
              placeholder={t('nationality')}
              priorityNames={CUSTOMER_COMMON_NATIONALITIES}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={t('nationalId')} name="nationalId">
                <Input prefix={<IdcardOutlined />} placeholder={t('nationalId')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('dateOfBirth')} name="dateOfBirth">
                <HijriDatePicker placeholder={t('dateOfBirth')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('mobile')}
                name="mobile"
                rules={[{ required: true, message: 'Please enter mobile number' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder={t('mobile')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('secondaryMobile')} name="secondaryMobileNumber">
                <Input prefix={<PhoneOutlined />} placeholder={t('secondaryMobile')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('cityAr')}
                name="cityAr"
                rules={[{ required: true, message: 'Please enter city in Arabic' }]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder={t('cityAr')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('cityEn')}
                name="cityEn"
                rules={[{ required: true, message: 'Please enter city in English' }]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder={t('cityEn')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('housingType')}
            name="housingType"
            rules={[{ required: true, message: 'Please select housing type' }]}
          >
            <Select
              placeholder={t('housingType')}
              options={toSelectOptions([...HOUSING_TYPE], language)}
            />
          </Form.Item>

          {/* Branch — only on create (optional; defaults to user's branch) */}
          {!editingCustomer && (
            <Form.Item
              label={language === 'ar' ? 'الفرع' : 'Branch'}
              name="branchId"
              tooltip={
                language === 'ar'
                  ? 'اختياري — الافتراضي فرع المستخدم الحالي'
                  : "Optional — defaults to the current user's branch"
              }
            >
              <BranchFilterSelect
                value={undefined}
                onChange={() => undefined}
                showSubBranchToggle={false}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Create Operation Contract Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextOutlined />
            <span>
              {language === 'ar' ? 'إنشاء عقد تشغيل جديد' : 'Create New Operation Contract'}
            </span>
          </div>
        }
        open={isContractModalVisible}
        onOk={handleContractSubmit}
        onCancel={() => {
          setIsContractModalVisible(false);
          contractForm.resetFields();
          setSelectedCustomerForContract(null);
          setContractSelectedOffer(null);
          setContractSelectedOffer(null);
        }}
        confirmLoading={isCreatingContract}
        okText={language === 'ar' ? 'إنشاء العقد' : 'Create Contract'}
        cancelText={language === 'ar' ? 'إلغاء' : 'Cancel'}
        width={900}
      >
        {/* {selectedCustomerForContract && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={40} icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 600 }}>{selectedCustomerForContract.arabicName}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  {language === 'ar' ? 'الهوية:' : 'ID:'}{' '}
                  {selectedCustomerForContract.identityNumber}
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Offer Selector */}
        <div style={{ marginBottom: 16 }}>
          <RentOfferSelector
            selectedOfferId={contractSelectedOffer?.id}
            onSelect={handleContractOfferSelect}
            language={language as 'ar' | 'en'}
            compact
          />
        </div>

        <Form form={contractForm} layout="vertical">
          <Form.Item name="offerId" hidden>
            <input />
          </Form.Item>

          {/* Customer Information Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'معلومات العميل' : 'Customer Information'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'كيف وصلت لنا' : 'How did you reach us'}
                name="marketerId"
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر' : 'Select'}
                  options={toSelectOptions([...MARKETER_SOURCE], language)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'عنوان العميل' : 'Customer Address'}
                name="customerAddress"
              >
                <Input placeholder={language === 'ar' ? 'عنوان العميل' : 'Customer address'} />
              </Form.Item>
            </Col>
          </Row>

          {/* Contract Details Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'تفاصيل العقد' : 'Contract Details'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'نوع العملية' : 'Operation Type'}
                name="operationType"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء اختيار نوع العملية'
                        : 'Please select operation type',
                  },
                ]}
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر نوع العملية' : 'Select operation type'}
                  options={toSelectOptions([...OPERATION_TYPE], language)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'طريقة السداد' : 'Payment Method'}
                name="paymentMethod"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء اختيار طريقة السداد'
                        : 'Please select payment method',
                  },
                ]}
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر طريقة السداد' : 'Select payment method'}
                  options={toSelectOptions([...PAYMENT_METHOD], language)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'الجنسية' : 'Nationality'}
                    {contractSelectedOffer && (
                      <Tag color="green" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="nationalityId"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar' ? 'الرجاء اختيار الجنسية' : 'Please select nationality',
                  },
                ]}
              >
                <NationalitySelect
                  placeholder={language === 'ar' ? 'اختر الجنسية' : 'Select Nationality'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'المهنة' : 'Job'}
                    {contractSelectedOffer && (
                      <Tag color="blue" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="jobId"
                rules={[
                  {
                    required: true,
                    message: language === 'ar' ? 'الرجاء اختيار المهنة' : 'Please select job',
                  },
                ]}
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر المهنة' : 'Select Job'}
                  loading={isLoadingJobs}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) => {
                    const label = String(option?.label ?? '');
                    return label.toLowerCase().includes(input.toLowerCase());
                  }}
                  options={jobs.map((job: any) => ({
                    value: job.id,
                    label:
                      language === 'ar'
                        ? job.jobNameAr || job.jobNameEn || `Job ${job.id}`
                        : job.jobNameEn || job.jobNameAr || `Job ${job.id}`,
                  }))}
                  notFoundContent={
                    isLoadingJobs ? (
                      <Spin size="small" />
                    ) : (
                      <Empty
                        description={language === 'ar' ? 'لا توجد مهن' : 'No jobs available'}
                      />
                    )
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'مدة العقد' : 'Contract Duration'}
                    {contractSelectedOffer && (
                      <Tag color="orange" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="duration"
              >
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'المدة بالأشهر' : 'Duration in months'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'الخبرة السابقة' : 'Previous Experience'}
                name="previousExperience"
              >
                <Select
                  placeholder={language === 'ar' ? 'اختر' : 'Select'}
                  options={toSelectOptions([...PREVIOUS_EXPERIENCE], language)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'تاريخ بداية العقد' : 'Contract Start Date'}
                name="contractStartDate"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar'
                        ? 'الرجاء اختيار تاريخ البداية'
                        : 'Please select start date',
                  },
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'تاريخ نهاية العقد' : 'Contract End Date'}
                name="contractEndDate"
                rules={[
                  {
                    required: true,
                    message:
                      language === 'ar' ? 'الرجاء اختيار تاريخ النهاية' : 'Please select end date',
                  },
                ]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          {/* Pricing Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'التسعير' : 'Pricing'}
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'التكلفة' : 'Cost'}
                    {contractSelectedOffer && (
                      <Tag color="green" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="cost"
                rules={[
                  {
                    required: true,
                    message: language === 'ar' ? 'الرجاء إدخال التكلفة' : 'Please enter cost',
                  },
                ]}
              >
                <Input
                  type="number"
                  prefix="SAR"
                  placeholder={language === 'ar' ? 'التكلفة' : 'Cost'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    {language === 'ar' ? 'التأمين' : 'Insurance'}
                    {contractSelectedOffer && (
                      <Tag color="purple" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {language === 'ar' ? 'من العرض' : 'From Offer'}
                      </Tag>
                    )}
                  </span>
                }
                name="insurance"
              >
                <Input
                  type="number"
                  prefix="SAR"
                  placeholder={language === 'ar' ? 'قيمة التأمين' : 'Insurance value'}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Worker Information Section */}
          <Divider plain style={{ fontWeight: 600, textAlign: 'left' }}>
            {language === 'ar' ? 'معلومات العامل' : 'Worker Information'}
          </Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label={language === 'ar' ? 'العامل' : 'Worker'} name="workerId">
                <WorkerSelect isRtl={language === 'ar'} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'اسم العامل (عربي)' : 'Worker Name (Arabic)'}
                name="workerNameAr"
              >
                <Input
                  placeholder={language === 'ar' ? 'اسم العامل بالعربي' : 'Worker name in Arabic'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'اسم العامل (إنجليزي)' : 'Worker Name (English)'}
                name="workerNameEn"
              >
                <Input
                  placeholder={
                    language === 'ar' ? 'اسم العامل بالإنجليزي' : 'Worker name in English'
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'هاتف العامل' : 'Worker Phone'}
                name="workerPhone"
              >
                <Input
                  placeholder={language === 'ar' ? 'رقم هاتف العامل' : 'Worker phone number'}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={language === 'ar' ? 'عدد العمال' : 'Workers Count'}
                name="workersCount"
              >
                <Input
                  type="number"
                  placeholder={language === 'ar' ? 'عدد العمال' : 'Number of workers'}
                  defaultValue={1}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
