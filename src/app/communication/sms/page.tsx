'use client';

import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Input,
  Select,
  Statistic,
  Row,
  Col,
  Badge,
  Button,
  Space,
  Tabs,
  Card,
  Progress,
  message,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  PhoneOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import styles from './CustomerSMS.module.css';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface Customer {
  id: number;
  nameAr: string;
  nameEn: string;
  phone: string;
  nationality: string;
  contractType: string;
  branch: string;
  status: 'active' | 'inactive';
}

interface SMSTemplate {
  id: number;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  category: string;
}

interface SMSHistory {
  id: number;
  recipients: number;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  sentDate: string;
  sentBy: string;
  cost: number;
}

export default function CustomerSMSPage() {
  const { language } = useAuthStore();
  const isArabic = language === 'ar';

  // State
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [filterNationality, setFilterNationality] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterContractType, setFilterContractType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('compose');

  // Mock data
  const mockCustomers: Customer[] = [
    {
      id: 1,
      nameAr: 'منيرة سعد عبدالله القحطاني',
      nameEn: 'Munira Saad Al-Qahtani',
      phone: '0501234567',
      nationality: 'Saudi Arabia',
      contractType: 'recruitment',
      branch: 'Main Branch',
      status: 'active',
    },
    {
      id: 2,
      nameAr: 'خالد محمد سعيد الزهراني',
      nameEn: 'Khalid Mohammed Al-Zahrani',
      phone: '0507654321',
      nationality: 'Saudi Arabia',
      contractType: 'rent',
      branch: 'Main Branch',
      status: 'active',
    },
    {
      id: 3,
      nameAr: 'فاطمة أحمد علي الحربي',
      nameEn: 'Fatima Ahmed Al-Harbi',
      phone: '0559876543',
      nationality: 'Saudi Arabia',
      contractType: 'sponsorship-transfer',
      branch: 'Branch 2',
      status: 'active',
    },
    {
      id: 4,
      nameAr: 'عبدالرحمن صالح محمد العتيبي',
      nameEn: 'Abdul-Rahman Saleh Al-Otaibi',
      phone: '0551234567',
      nationality: 'Saudi Arabia',
      contractType: 'recruitment',
      branch: 'Main Branch',
      status: 'active',
    },
    {
      id: 5,
      nameAr: 'نورة عبدالله فهد الدوسري',
      nameEn: 'Noura Abdullah Al-Dosari',
      phone: '0502345678',
      nationality: 'Saudi Arabia',
      contractType: 'rent',
      branch: 'Branch 2',
      status: 'active',
    },
  ];

  const mockTemplates: SMSTemplate[] = [
    {
      id: 1,
      titleAr: 'رسالة ترحيبية',
      titleEn: 'Welcome Message',
      messageAr: 'مرحباً بك في خدماتنا. نحن سعداء بخدمتك',
      messageEn: 'Welcome to our services. We are happy to serve you',
      category: 'general',
    },
    {
      id: 2,
      titleAr: 'تذكير بالموعد',
      titleEn: 'Appointment Reminder',
      messageAr: 'تذكير: لديك موعد غداً الساعة 10 صباحاً',
      messageEn: 'Reminder: You have an appointment tomorrow at 10 AM',
      category: 'reminder',
    },
    {
      id: 3,
      titleAr: 'تأكيد العقد',
      titleEn: 'Contract Confirmation',
      messageAr: 'تم تأكيد عقدكم بنجاح. شكراً لثقتكم',
      messageEn: 'Your contract has been confirmed successfully. Thank you for your trust',
      category: 'contract',
    },
    {
      id: 4,
      titleAr: 'إشعار الدفع',
      titleEn: 'Payment Notification',
      messageAr: 'تم استلام دفعتكم بنجاح',
      messageEn: 'Your payment has been received successfully',
      category: 'payment',
    },
    {
      id: 5,
      titleAr: 'متابعة الخدمة',
      titleEn: 'Service Follow-up',
      messageAr: 'نود الاطمئنان على مستوى الخدمة المقدمة',
      messageEn: 'We would like to check on the service quality',
      category: 'followup',
    },
  ];

  const mockHistory: SMSHistory[] = [
    {
      id: 1,
      recipients: 245,
      message: 'مرحباً بك في خدماتنا الجديدة',
      status: 'sent',
      sentDate: '2026-01-15',
      sentBy: 'أحمد محمد',
      cost: 122.5,
    },
    {
      id: 2,
      recipients: 180,
      message: 'تذكير بالموعد المحدد',
      status: 'sent',
      sentDate: '2026-01-14',
      sentBy: 'سارة أحمد',
      cost: 90.0,
    },
    {
      id: 3,
      recipients: 320,
      message: 'عرض خاص لعملائنا المميزين',
      status: 'sent',
      sentDate: '2026-01-13',
      sentBy: 'خالد علي',
      cost: 160.0,
    },
    {
      id: 4,
      recipients: 95,
      message: 'تأكيد استلام الطلب',
      status: 'pending',
      sentDate: '2026-01-12',
      sentBy: 'فاطمة حسن',
      cost: 47.5,
    },
    {
      id: 5,
      recipients: 150,
      message: 'شكراً لتعاملكم معنا',
      status: 'sent',
      sentDate: '2026-01-11',
      sentBy: 'محمد صالح',
      cost: 75.0,
    },
  ];

  // Translations
  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      ar: {
        customerSMS: 'رسائل العملاء',
        compose: 'إنشاء رسالة',
        templates: 'القوالب',
        history: 'السجل',
        totalSent: 'إجمالي المرسل',
        todaySent: 'المرسل اليوم',
        pending: 'قيد الإرسال',
        totalCost: 'التكلفة الإجمالية',
        sar: 'ريال',
        selectRecipients: 'اختر المستلمين',
        addPhoneManually: 'إضافة رقم يدوياً',
        phoneNumber: 'رقم الهاتف',
        add: 'إضافة',
        selectedRecipients: 'المستلمون المحددون',
        recipients: 'مستلم',
        message: 'الرسالة',
        writeMessage: 'اكتب رسالتك هنا...',
        characters: 'حرف',
        smsCount: 'عدد الرسائل',
        estimatedCost: 'التكلفة المتوقعة',
        selectTemplate: 'اختر قالب',
        useTemplate: 'استخدام القالب',
        send: 'إرسال',
        clear: 'مسح',
        filterByNationality: 'تصفية حسب الجنسية',
        filterByBranch: 'تصفية حسب الفرع',
        filterByContractType: 'تصفية حسب نوع العقد',
        all: 'الكل',
        recruitment: 'استقدام',
        rent: 'تأجير',
        sponsorshipTransfer: 'نقل كفالة',
        mainBranch: 'الفرع الرئيسي',
        branch2: 'الفرع 2',
        smsTemplates: 'قوالب الرسائل',
        general: 'عام',
        reminder: 'تذكير',
        contract: 'عقد',
        payment: 'دفع',
        followup: 'متابعة',
        smsHistory: 'سجل الرسائل',
        sentDate: 'تاريخ الإرسال',
        sentBy: 'أرسل بواسطة',
        status: 'الحالة',
        sent: 'مرسل',
        failed: 'فشل',
        cost: 'التكلفة',
        noRecipients: 'لا يوجد مستلمون محددون',
        addRecipientsFirst: 'الرجاء إضافة مستلمين أولاً',
        messageSent: 'تم إرسال الرسالة بنجاح',
        phoneAdded: 'تمت إضافة الرقم',
        invalidPhone: 'رقم هاتف غير صحيح',
        selectCustomers: 'اختر العملاء',
        customerName: 'اسم العميل',
        nationality: 'الجنسية',
        contractType: 'نوع العقد',
        branch: 'الفرع',
      },
      en: {
        customerSMS: 'Customer SMS',
        compose: 'Compose',
        templates: 'Templates',
        history: 'History',
        totalSent: 'Total Sent',
        todaySent: 'Today Sent',
        pending: 'Pending',
        totalCost: 'Total Cost',
        sar: 'SAR',
        selectRecipients: 'Select Recipients',
        addPhoneManually: 'Add Phone Manually',
        phoneNumber: 'Phone Number',
        add: 'Add',
        selectedRecipients: 'Selected Recipients',
        recipients: 'recipients',
        message: 'Message',
        writeMessage: 'Write your message here...',
        characters: 'characters',
        smsCount: 'SMS Count',
        estimatedCost: 'Estimated Cost',
        selectTemplate: 'Select Template',
        useTemplate: 'Use Template',
        send: 'Send',
        clear: 'Clear',
        filterByNationality: 'Filter by Nationality',
        filterByBranch: 'Filter by Branch',
        filterByContractType: 'Filter by Contract Type',
        all: 'All',
        recruitment: 'Recruitment',
        rent: 'Rent',
        sponsorshipTransfer: 'Sponsorship Transfer',
        mainBranch: 'Main Branch',
        branch2: 'Branch 2',
        smsTemplates: 'SMS Templates',
        general: 'General',
        reminder: 'Reminder',
        contract: 'Contract',
        payment: 'Payment',
        followup: 'Follow-up',
        smsHistory: 'SMS History',
        sentDate: 'Sent Date',
        sentBy: 'Sent By',
        status: 'Status',
        sent: 'Sent',
        failed: 'Failed',
        cost: 'Cost',
        noRecipients: 'No recipients selected',
        addRecipientsFirst: 'Please add recipients first',
        messageSent: 'Message sent successfully',
        phoneAdded: 'Phone number added',
        invalidPhone: 'Invalid phone number',
        selectCustomers: 'Select Customers',
        customerName: 'Customer Name',
        nationality: 'Nationality',
        contractType: 'Contract Type',
        branch: 'Branch',
      },
    };
    return translations[language][key] || key;
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      const matchesNationality =
        filterNationality === 'all' || customer.nationality === filterNationality;
      const matchesBranch = filterBranch === 'all' || customer.branch === filterBranch;
      const matchesContractType =
        filterContractType === 'all' || customer.contractType === filterContractType;
      return matchesNationality && matchesBranch && matchesContractType;
    });
  }, [filterNationality, filterBranch, filterContractType, mockCustomers]);

  // Calculate SMS stats
  const characterCount = smsMessage.length;
  const smsCount = Math.ceil(characterCount / 160) || 1;
  const totalRecipients = selectedCustomers.length + phoneNumbers.length;
  const estimatedCost = (smsCount * totalRecipients * 0.5).toFixed(2);

  // Handle phone number addition
  const handleAddPhone = () => {
    const phoneRegex = /^05[0-9]{8}$/;
    if (phoneRegex.test(newPhone)) {
      if (!phoneNumbers.includes(newPhone)) {
        setPhoneNumbers([...phoneNumbers, newPhone]);
        setNewPhone('');
        message.success(t('phoneAdded'));
      }
    } else {
      message.error(t('invalidPhone'));
    }
  };

  // Handle send SMS
  const handleSendSMS = () => {
    if (totalRecipients === 0) {
      message.warning(t('addRecipientsFirst'));
      return;
    }
    if (!smsMessage.trim()) {
      message.warning('Please enter a message');
      return;
    }
    message.success(t('messageSent'));
    // Reset form
    setSelectedCustomers([]);
    setPhoneNumbers([]);
    setSmsMessage('');
    setSelectedTemplate(null);
  };

  // Handle template selection
  const handleTemplateUse = (templateId: number) => {
    const template = mockTemplates.find((t) => t.id === templateId);
    if (template) {
      setSmsMessage(isArabic ? template.messageAr : template.messageEn);
      setSelectedTemplate(templateId);
      setActiveTab('compose');
    }
  };

  // Statistics
  const statistics = {
    totalSent: 1245,
    todaySent: 85,
    pending: 12,
    totalCost: 622.5,
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <MessageOutlined className={styles.headerIcon} />
            <div>
              <h1 className={styles.pageTitle}>{t('customerSMS')}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('totalSent')}
              value={statistics.totalSent}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#003366' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('todaySent')}
              value={statistics.todaySent}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#00AA64' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('pending')}
              value={statistics.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={styles.statCard}>
            <Statistic
              title={t('totalCost')}
              value={statistics.totalCost}
              suffix={t('sar')}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#00478C' }}
              precision={2}
            />
          </div>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <div className={styles.mainCard}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} className={styles.tabs}>
          {/* Compose Tab */}
          <TabPane
            tab={
              <span>
                <MessageOutlined />
                {t('compose')}
              </span>
            }
            key="compose"
          >
            <Row gutter={[24, 24]}>
              {/* Left Column - Recipients */}
              <Col xs={24} lg={12}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <TeamOutlined /> {t('selectRecipients')}
                  </h3>

                  {/* Filters */}
                  <Row gutter={[12, 12]} className={styles.filters}>
                    <Col xs={24} md={8}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder={t('filterByNationality')}
                        value={filterNationality}
                        onChange={setFilterNationality}
                      >
                        <Option value="all">{t('all')}</Option>
                        <Option value="Saudi Arabia">Saudi Arabia</Option>
                      </Select>
                    </Col>
                    <Col xs={24} md={8}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder={t('filterByBranch')}
                        value={filterBranch}
                        onChange={setFilterBranch}
                      >
                        <Option value="all">{t('all')}</Option>
                        <Option value="Main Branch">{t('mainBranch')}</Option>
                        <Option value="Branch 2">{t('branch2')}</Option>
                      </Select>
                    </Col>
                    <Col xs={24} md={8}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder={t('filterByContractType')}
                        value={filterContractType}
                        onChange={setFilterContractType}
                      >
                        <Option value="all">{t('all')}</Option>
                        <Option value="recruitment">{t('recruitment')}</Option>
                        <Option value="rent">{t('rent')}</Option>
                        <Option value="sponsorship-transfer">{t('sponsorshipTransfer')}</Option>
                      </Select>
                    </Col>
                  </Row>

                  {/* Customer List */}
                  <div className={styles.customerList}>
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`${styles.customerCard} ${
                          selectedCustomers.includes(customer.id) ? styles.selected : ''
                        }`}
                        onClick={() => {
                          if (selectedCustomers.includes(customer.id)) {
                            setSelectedCustomers(
                              selectedCustomers.filter((id) => id !== customer.id)
                            );
                          } else {
                            setSelectedCustomers([...selectedCustomers, customer.id]);
                          }
                        }}
                      >
                        <div className={styles.customerInfo}>
                          <UserOutlined className={styles.customerIcon} />
                          <div>
                            <div className={styles.customerName}>
                              {isArabic ? customer.nameAr : customer.nameEn}
                            </div>
                            <div className={styles.customerPhone}>
                              <PhoneOutlined /> {customer.phone}
                            </div>
                          </div>
                        </div>
                        {selectedCustomers.includes(customer.id) && (
                          <CheckCircleOutlined className={styles.checkIcon} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Manual Phone Addition */}
                  <div className={styles.manualPhone}>
                    <h4>{t('addPhoneManually')}</h4>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder={t('phoneNumber')}
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        prefix={<PhoneOutlined />}
                        onPressEnter={handleAddPhone}
                      />
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPhone}>
                        {t('add')}
                      </Button>
                    </Space.Compact>
                  </div>

                  {/* Phone Numbers List */}
                  {phoneNumbers.length > 0 && (
                    <div className={styles.phoneList}>
                      {phoneNumbers.map((phone, index) => (
                        <Badge
                          key={index}
                          count={
                            <DeleteOutlined
                              onClick={() =>
                                setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index))
                              }
                              style={{ cursor: 'pointer', color: '#ff4d4f' }}
                            />
                          }
                        >
                          <div className={styles.phoneBadge}>{phone}</div>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Recipients Count */}
                  <div className={styles.recipientsCount}>
                    <TeamOutlined /> {t('selectedRecipients')}: <strong>{totalRecipients}</strong>{' '}
                    {t('recipients')}
                  </div>
                </div>
              </Col>

              {/* Right Column - Message */}
              <Col xs={24} lg={12}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <FileTextOutlined /> {t('message')}
                  </h3>

                  {/* Message Input */}
                  <TextArea
                    rows={8}
                    placeholder={t('writeMessage')}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className={styles.messageInput}
                    maxLength={1000}
                  />

                  {/* Message Stats */}
                  <div className={styles.messageStats}>
                    <div className={styles.statItem}>
                      <span>{t('characters')}:</span>
                      <strong>{characterCount}/1000</strong>
                    </div>
                    <div className={styles.statItem}>
                      <span>{t('smsCount')}:</span>
                      <strong>{smsCount}</strong>
                    </div>
                    <div className={styles.statItem}>
                      <span>{t('estimatedCost')}:</span>
                      <strong>
                        {estimatedCost} {t('sar')}
                      </strong>
                    </div>
                  </div>

                  {/* Character Progress */}
                  <Progress
                    percent={(characterCount / 1000) * 100}
                    showInfo={false}
                    strokeColor={{
                      '0%': '#003366',
                      '100%': '#00AA64',
                    }}
                  />

                  {/* Template Selector */}
                  <div className={styles.templateSelector}>
                    <Select
                      style={{ width: '100%' }}
                      placeholder={t('selectTemplate')}
                      value={selectedTemplate}
                      onChange={(value) => handleTemplateUse(value)}
                      allowClear
                    >
                      {mockTemplates.map((template) => (
                        <Option key={template.id} value={template.id}>
                          {isArabic ? template.titleAr : template.titleEn}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.actions}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={handleSendSMS}
                      block
                      disabled={totalRecipients === 0 || !smsMessage.trim()}
                    >
                      {t('send')} ({totalRecipients} {t('recipients')})
                    </Button>
                    <Button
                      size="large"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setSmsMessage('');
                        setSelectedCustomers([]);
                        setPhoneNumbers([]);
                        setSelectedTemplate(null);
                      }}
                      block
                    >
                      {t('clear')}
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </TabPane>

          {/* Templates Tab */}
          <TabPane
            tab={
              <span>
                <FileTextOutlined />
                {t('templates')}
              </span>
            }
            key="templates"
          >
            <div className={styles.templatesGrid}>
              {mockTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={styles.templateCard}
                  hoverable
                  onClick={() => handleTemplateUse(template.id)}
                >
                  <h4 className={styles.templateTitle}>
                    {isArabic ? template.titleAr : template.titleEn}
                  </h4>
                  <Badge count={t(template.category)} style={{ backgroundColor: '#00478C' }} />
                  <p className={styles.templateMessage}>
                    {isArabic ? template.messageAr : template.messageEn}
                  </p>
                  <Button type="link" icon={<SendOutlined />}>
                    {t('useTemplate')}
                  </Button>
                </Card>
              ))}
            </div>
          </TabPane>

          {/* History Tab */}
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                {t('history')}
              </span>
            }
            key="history"
          >
            <div className={styles.historyList}>
              {mockHistory.map((item) => (
                <div key={item.id} className={styles.historyCard}>
                  <div className={styles.historyHeader}>
                    <div className={styles.historyTitle}>
                      <SendOutlined className={styles.historyIcon} />
                      <div>
                        <div className={styles.historyRecipients}>
                          {item.recipients} {t('recipients')}
                        </div>
                        <div className={styles.historyDate}>{item.sentDate}</div>
                      </div>
                    </div>
                    <Badge
                      status={
                        item.status === 'sent'
                          ? 'success'
                          : item.status === 'pending'
                          ? 'processing'
                          : 'error'
                      }
                      text={t(item.status)}
                    />
                  </div>
                  <div className={styles.historyMessage}>{item.message}</div>
                  <div className={styles.historyFooter}>
                    <span>
                      {t('sentBy')}: {item.sentBy}
                    </span>
                    <span>
                      {t('cost')}: {item.cost} {t('sar')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}
