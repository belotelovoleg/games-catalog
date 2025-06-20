import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Translation resources
const resources = {
  en: {
    translation: {
      // Login page
      login_title: 'Login to Game Catalog',
      login_subtitle: 'Organize and track your video game collection',
      login_description: 'Welcome to your personal gaming library! Catalog your cartridges, track your collection status, and discover games across multiple platforms. Build the ultimate database of your gaming adventures.',
      login_email_label: 'Email',
      login_email_placeholder: 'Enter your email address',
      login_password_label: 'Password',
      login_password_placeholder: 'Enter your password',
      login_button: 'Login',
      login_button_loading: 'Logging in...',
      login_no_account: "Don't have an account?",
      login_register_link: 'Register here',
      login_error_invalid: 'Invalid email or password',
      login_error_network: 'Network error. Please try again.',
      login_error_general: 'An error occurred during login',
      login_welcome_back: 'Welcome Back',
      login_sign_in_text: 'Sign in to your account',
      login_feature_collection: 'Collection Management',
      login_feature_collection_desc: 'Organize cartridges across platforms',
      login_feature_progress: 'Track Progress',
      login_feature_progress_desc: 'Monitor your gaming library',

      // Register page
      register_title: 'Join Game Catalog',
      register_subtitle: 'Start building your digital game library',
      register_description: 'Create your account to begin cataloging your video game collection. Track cartridges, manage wishlists, and organize your gaming library across all platforms.',
      register_name_label: 'Full Name',
      register_name_placeholder: 'Enter your full name',
      register_email_label: 'Email',
      register_email_placeholder: 'Enter your email address',
      register_password_label: 'Password',
      register_password_placeholder: 'Choose a secure password',
      register_confirm_password_label: 'Confirm Password',
      register_confirm_password_placeholder: 'Confirm your password',
      register_button: 'Create Account',
      register_button_loading: 'Creating account...',
      register_have_account: 'Already have an account?',
      register_login_link: 'Login here',
      register_error_passwords_match: 'Passwords do not match',
      register_error_email_exists: 'Email already exists',
      register_error_network: 'Network error. Please try again.',
      register_error_general: 'An error occurred during registration',
      register_success: 'Account created successfully! Please login.',
      register_create_account: 'Create Account',
      register_join_community: 'Join the game collection community',
      register_feature_library: 'Digital Library',
      register_feature_library_desc: 'Build your complete gaming catalog',
      register_feature_organize: 'Track & Organize',
      register_feature_organize_desc: 'Manage your collection status',      // Common
      common_required_field: 'This field is required',
      common_invalid_email: 'Please enter a valid email address',
      common_password_too_short: 'Password must be at least 6 characters',
        // Language & Theme
      language_title: 'Language',
      theme_light: 'Light Mode',
      theme_dark: 'Dark Mode',
      
      // Left Menu
      leftmenu_app_title: 'Game Catalog',
      leftmenu_group_catalog: 'Catalog',
      leftmenu_item_gamecatalog: 'Game Catalog',
      leftmenu_group_admin: 'Admin',
      leftmenu_item_platforms: 'Platform Management',
      leftmenu_item_users: 'User Management',
      leftmenu_item_igdbsync: 'IGDB Sync Manager',      leftmenu_action_logout: 'Logout',
      leftmenu_tooltip_menu: 'Toggle menu',
      leftmenu_tooltip_theme_light: 'Switch to light mode',
      leftmenu_tooltip_theme_dark: 'Switch to dark mode',
      leftmenu_tooltip_logout: 'Logout',
    }
  },
  uk: {
    translation: {
      // Login page
      login_title: 'Вхід до Каталогу Ігор',
      login_subtitle: 'Організуйте та відстежуйте свою колекцію відеоігор',
      login_description: 'Ласкаво просимо до вашої особистої ігрової бібліотеки! Каталогізуйте картриджі, відстежуйте статус колекції та відкривайте ігри на різних платформах. Створіть найкращу базу даних ваших ігрових пригод.',
      login_email_label: 'Електронна пошта',
      login_email_placeholder: 'Введіть адресу електронної пошти',
      login_password_label: 'Пароль',
      login_password_placeholder: 'Введіть пароль',
      login_button: 'Увійти',
      login_button_loading: 'Вхід...',
      login_no_account: 'Немає облікового запису?',
      login_register_link: 'Зареєструватися тут',
      login_error_invalid: 'Невірна електронна пошта або пароль',
      login_error_network: 'Помилка мережі. Спробуйте ще раз.',
      login_error_general: 'Сталася помилка під час входу',
      login_welcome_back: 'З поверненням',
      login_sign_in_text: 'Увійдіть до свого облікового запису',
      login_feature_collection: 'Управління Колекцією',
      login_feature_collection_desc: 'Організуйте картриджі на різних платформах',
      login_feature_progress: 'Відстеження Прогресу',
      login_feature_progress_desc: 'Моніторте свою ігрову бібліотеку',

      // Register page
      register_title: 'Приєднатися до Каталогу Ігор',
      register_subtitle: 'Почніть будувати свою цифрову ігрову бібліотеку',
      register_description: 'Створіть обліковий запис, щоб почати каталогізувати свою колекцію відеоігор. Відстежуйте картриджі, керуйте списками бажань та організовуйте ігрову бібліотеку на всіх платформах.',
      register_name_label: 'Повне ім\'я',
      register_name_placeholder: 'Введіть повне ім\'я',
      register_email_label: 'Електронна пошта',
      register_email_placeholder: 'Введіть адресу електронної пошти',
      register_password_label: 'Пароль',
      register_password_placeholder: 'Оберіть надійний пароль',
      register_confirm_password_label: 'Підтвердіть пароль',
      register_confirm_password_placeholder: 'Підтвердіть пароль',
      register_button: 'Створити обліковий запис',
      register_button_loading: 'Створення облікового запису...',
      register_have_account: 'Вже маєте обліковий запис?',
      register_login_link: 'Увійти тут',
      register_error_passwords_match: 'Паролі не співпадають',
      register_error_email_exists: 'Електронна пошта вже існує',
      register_error_network: 'Помилка мережі. Спробуйте ще раз.',
      register_error_general: 'Сталася помилка під час реєстрації',
      register_success: 'Обліковий запис успішно створено! Будь ласка, увійдіть.',
      register_create_account: 'Створити Обліковий Запис',
      register_join_community: 'Приєднайтесь до спільноти колекціонерів ігор',
      register_feature_library: 'Цифрова Бібліотека',
      register_feature_library_desc: 'Створіть повний каталог своїх ігор',
      register_feature_organize: 'Відстеження та Організація',
      register_feature_organize_desc: 'Керуйте статусом своєї колекції',      // Common
      common_required_field: 'Це поле є обов\'язковим',
      common_invalid_email: 'Будь ласка, введіть дійсну адресу електронної пошти',
      common_password_too_short: 'Пароль повинен містити принаймні 6 символів',
        // Language & Theme
      language_title: 'Мова',
      theme_light: 'Світла тема',
      theme_dark: 'Темна тема',
      
      // Left Menu
      leftmenu_app_title: 'Каталог Ігор',
      leftmenu_group_catalog: 'Каталог',
      leftmenu_item_gamecatalog: 'Каталог Ігор',
      leftmenu_group_admin: 'Адміністрування',
      leftmenu_item_platforms: 'Керування Платформами',
      leftmenu_item_users: 'Керування Користувачами',
      leftmenu_item_igdbsync: 'Синхронізація з IGDB',      leftmenu_action_logout: 'Вийти',
      leftmenu_tooltip_menu: 'Перемкнути меню',
      leftmenu_tooltip_theme_light: 'Перемкнути на світлу тему',
      leftmenu_tooltip_theme_dark: 'Перемкнути на темну тему',
      leftmenu_tooltip_logout: 'Вийти',
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
