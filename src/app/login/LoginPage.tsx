'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Form, Input, Button, Checkbox } from 'antd';
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  MailOutlined,
  LockOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { getTranslation } from '@/i18n/translations';
import type { Language } from '@/i18n/translations';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [form] = Form.useForm();
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoggingIn } = useAuth();
  const language = useAuthStore((state) => state.language);
  const setLanguage = useAuthStore((state) => state.setLanguage);

  const t = (key: string) => getTranslation(language, key);

  useEffect(() => {
    // Load language preference from localStorage
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang) {
      setLanguage(savedLang);
    }

    // Load remember me data
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      form.setFieldsValue({ username: savedUsername });
      setRememberMe(true);
    }
  }, [form, setLanguage]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSubmit = async (values: any) => {
    // Save remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberedUsername', values.username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

    // Call the real API login
    login({
      username: values.username,
      password: values.password,
    });
  };

  // Validation helper - for potential future use
  // const handleValidation = (_: any, value: string, field: string) => {
  //   const newErrors = { ...errors };
  //
  //   if (!value && field === "username") {
  //     newErrors[field] = t("common.enterUsername");
  //   } else if (!value && field === "password") {
  //     newErrors[field] = t("common.enterPassword");
  //   } else {
  //     delete newErrors[field];
  //   }
  //
  //   setErrors(newErrors);
  //   return Promise.resolve();
  // };

  return (
    <div
      className={`${styles.container} ${language === 'ar' ? 'rtl' : 'ltr'}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Left Side - Brand Section */}
      <div className={styles.brandSection}>
        <div className={styles.brandContent}>
          {/* Animated Gradient Background */}
          <div className={styles.gradientBg}></div>

          {/* Logo and Brand Info */}
          <div className={styles.brandInfo}>
            <div className={styles.logo}>
              <div className={styles.logoContainer}>
                <Image
                  src="/images/logo.png"
                  alt="Company Logo"
                  fill
                  priority
                  sizes="160px"
                  className={styles.logoImage}
                />
              </div>
            </div>

            <h1 className={styles.brandTitle}>{t('login.welcome')}</h1>

            <p className={styles.brandDescription}>{t('login.description')}</p>

            {/* Decorative Elements */}
            <div className={styles.decorativeShapes}>
              <div className={`${styles.shape} ${styles.shape1}`}></div>
              <div className={`${styles.shape} ${styles.shape2}`}></div>
              <div className={`${styles.shape} ${styles.shape3}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          {/* Header */}
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{t('login.title')}</h2>
            <p className={styles.formSubtitle}>{t('login.subtitle')}</p>
          </div>

          {/* Language Switcher */}
          <div className={styles.languageSwitcher}>
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`${styles.langBtn} ${language === 'ar' ? styles.active : ''}`}
              aria-label="Switch to Arabic"
            >
              العربية
            </button>
            <span className={styles.separator}>|</span>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`${styles.langBtn} ${language === 'en' ? styles.active : ''}`}
              aria-label="Switch to English"
            >
              English
            </button>
          </div>

          {/* Login Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            className={styles.form}
            autoComplete="off"
          >
            {/* Username/Email Field */}
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: t('common.enterUsername'),
                },
              ]}
              validateTrigger="onBlur"
            >
              <Input
                placeholder={t('login.usernameLabel')}
                prefix={
                  <MailOutlined
                    style={{
                      color: 'var(--brand-color, #003366)',
                      marginRight: language === 'en' ? '8px' : '0',
                      marginLeft: language === 'ar' ? '8px' : '0',
                    }}
                  />
                }
                size="large"
                className={styles.input}
                aria-label={t('login.usernameLabel')}
              />
            </Form.Item>

            {/* Password Field */}
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: t('common.enterPassword'),
                },
              ]}
              validateTrigger="onBlur"
            >
              <Input.Password
                placeholder={t('login.passwordLabel')}
                prefix={
                  <LockOutlined
                    style={{
                      color: 'var(--brand-color, #003366)',
                      marginRight: language === 'en' ? '8px' : '0',
                      marginLeft: language === 'ar' ? '8px' : '0',
                    }}
                  />
                }
                size="large"
                className={styles.input}
                iconRender={(visible) =>
                  visible ? (
                    <EyeTwoTone style={{ color: '#00478C' }} />
                  ) : (
                    <EyeInvisibleOutlined style={{ color: '#4B5563' }} />
                  )
                }
                aria-label={t('login.passwordLabel')}
              />
            </Form.Item>

            {/* Remember Me & Forgot Password */}
            <div className={styles.formActions}>
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.rememberCheckbox}
              >
                <span className={styles.rememberText}>{t('login.rememberMeLabel')}</span>
              </Checkbox>

              <Link href="/forgot-password" className={styles.forgotLink}>
                {t('login.forgotPasswordLink')}
              </Link>
            </div>

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isLoggingIn}
                disabled={isLoggingIn}
                className={styles.submitBtn}
                aria-busy={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <LoadingOutlined /> {t('common.loading')}
                  </>
                ) : (
                  t('login.loginButton')
                )}
              </Button>
            </Form.Item>
          </Form>

        </div>
      </div>
    </div>
  );
}
