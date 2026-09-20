import { AppLanguage, ToolId } from '../types';

export interface Translations {
  header: {
    brandSubtitle: string;
    allTools: string;
    switchThemeLight: string;
    switchThemeDark: string;
    toggleLanguagePrompt: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    categoryAll: string;
    categoryPdf: string;
    categoryDev: string;
    categorySecurity: string;
    toolsFound: string;
    noToolsTitle: string;
    noToolsDesc: string;
    clearFilter: string;
    privacyBadge: string;
  };
  tools: Record<
    ToolId,
    {
      name: string;
      shortDesc: string;
      categoryLabel: string;
    }
  >;
  footer: {
    tagline: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, Translations> = {
  en: {
    header: {
      brandSubtitle: 'All-in-One Utility Suite',
      allTools: 'All Tools',
      switchThemeLight: 'Switch to light mode',
      switchThemeDark: 'Switch to dark mode',
      toggleLanguagePrompt: 'Switch language to Khmer (ភាសាខ្មែរ)',
    },
    home: {
      heroTitle: 'Everyday Developer & File Utilities',
      heroSubtitle:
        'Fast, privacy-focused client-side tools. No uploads to external servers, no tracking, and zero data leaves your machine.',
      searchPlaceholder: 'Search tools (e.g. compress, merge, png, json, password)...',
      categoryAll: 'All Tools',
      categoryPdf: 'PDF Utilities',
      categoryDev: 'Developer',
      categorySecurity: 'Security',
      toolsFound: 'tools available',
      noToolsTitle: 'No matching tools found',
      noToolsDesc: 'Try adjusting your search query or selecting a different category.',
      clearFilter: 'Clear Search & Filter',
      privacyBadge: '100% Client-Side & Private',
    },
    tools: {
      home: {
        name: 'Home',
        shortDesc: 'Main tools dashboard',
        categoryLabel: 'General',
      },
      pdftopng: {
        name: 'PDF to Photo',
        shortDesc:
          'Convert PDF pages into crisp, high-resolution photo and PNG images with customizable DPI scale and ZIP batch download.',
        categoryLabel: 'PDF Utility',
      },
      imgtopdf: {
        name: 'Picture to PDF',
        shortDesc:
          'Convert JPG, PNG, and photos into a clean PDF document with drag-and-drop reordering, custom margins, and orientation.',
        categoryLabel: 'PDF Utility',
      },
      unlockpdf: {
        name: 'Unlock PDF',
        shortDesc:
          'Remove passwords and restrictions automatically with 100% original vector and text quality.',
        categoryLabel: 'PDF Utility',
      },
      mergepdf: {
        name: 'Merge PDF Files',
        shortDesc:
          'Combine multiple PDF documents into a single file with drag-and-drop custom ordering and 100% original quality.',
        categoryLabel: 'PDF Utility',
      },
      compresspdf: {
        name: 'Compress PDF File Size',
        shortDesc:
          'Shrink files with Low (30-50%), Medium (50-70%), and High (70-90%) reduction tiers while keeping maximum quality.',
        categoryLabel: 'PDF Utility',
      },
      json: {
        name: 'JSON Formatter & Validator',
        shortDesc:
          'Validate, format, minify, and inspect complex JSON objects with syntax error location.',
        categoryLabel: 'Developer',
      },
      password: {
        name: 'Secure Password Generator',
        shortDesc:
          'Generate cryptographic high-entropy passwords with customizable symbols, numbers, and length.',
        categoryLabel: 'Security',
      },
    },
    footer: {
      tagline: 'Moew Tools. All processing executes 100% securely inside your browser.',
    },
  },
  km: {
    header: {
      brandSubtitle: 'ឧបករណ៍ប្រើប្រាស់ទាំងអស់ក្នុងតែមួយ',
      allTools: 'ឧបករណ៍ទាំងអស់',
      switchThemeLight: 'ប្ដូរទៅពន្លឺភ្លឺ (Light Mode)',
      switchThemeDark: 'ប្ដូរទៅងងឹត (Dark Mode)',
      toggleLanguagePrompt: 'ប្ដូរទៅភាសាអង់គ្លេស (Switch to English)',
    },
    home: {
      heroTitle: 'ឧបករណ៍សម្រាប់អ្នកអភិវឌ្ឍន៍ និងឯកសារប្រចាំថ្ងៃ',
      heroSubtitle:
        'ឧបករណ៍ដំណើរការរហ័ស ផ្តោតលើសុវត្ថិភាពខ្ពស់។ គ្មានការបញ្ជូនឯកសារទៅខាងក្រៅ គ្មានការតាមដាន និងរក្សាទិន្នន័យលើឧបករណ៍របស់អ្នក 100%។',
      searchPlaceholder: 'ស្វែងរកឧបករណ៍ (ឧ. បង្រួម, បញ្ចូលគ្នា, PNG, JSON, លេខសម្ងាត់)...',
      categoryAll: 'ឧបករណ៍ទាំងអស់',
      categoryPdf: 'ឧបករណ៍ PDF',
      categoryDev: 'អ្នកអភិវឌ្ឍន៍',
      categorySecurity: 'សុវត្ថិភាព',
      toolsFound: 'ឧបករណ៍ដែលមាន',
      noToolsTitle: 'រកមិនឃើញឧបករណ៍ដែលត្រូវគ្នាទេ',
      noToolsDesc: 'សូមព្យាយាមស្វែងរកពាក្យផ្សេង ឬជ្រើសរើសប្រភេទផ្សេងទៀត។',
      clearFilter: 'សម្អាតការស្វែងរក និងតម្រង',
      privacyBadge: 'សុវត្ថិភាព 100% លើឧបករណ៍របស់អ្នក',
    },
    tools: {
      home: {
        name: 'ទំព័រដើម',
        shortDesc: 'ផ្ទាំងគ្រប់គ្រងឧបករណ៍ចម្បង',
        categoryLabel: 'ទូទៅ',
      },
      pdftopng: {
        name: 'បំប្លែង PDF ទៅជារូបថត (PDF to Photo)',
        shortDesc:
          'បំប្លែងទំព័រ PDF ទៅជារូបថត និងរូបភាព PNG កម្រិតច្បាស់ខ្ពស់ ជាមួយជម្រើសកម្រិត DPI និងការទាញយកជាកញ្ចប់ ZIP។',
        categoryLabel: 'ឧបករណ៍ PDF',
      },
      imgtopdf: {
        name: 'បំប្លែងរូបភាពទៅជា PDF',
        shortDesc:
          'បំប្លែងរូបភាព JPG, PNG ទៅជាឯកសារ PDF គុណភាពខ្ពស់ ជាមួយការអូសរៀបចំលំដាប់ ជម្រើសទំហំទំព័រ និងគែម។',
        categoryLabel: 'ឧបករណ៍ PDF',
      },
      unlockpdf: {
        name: 'ដោះលេខសម្ងាត់ PDF',
        shortDesc:
          'ដោះលេខសម្ងាត់ និងការកម្រិតផ្សេងៗដោយស្វ័យប្រវត្តិ ដោយរក្សាគុណភាពអក្សរ និងវ៉ិចទ័រដើម 100%។',
        categoryLabel: 'ឧបករណ៍ PDF',
      },
      mergepdf: {
        name: 'បញ្ចូលឯកសារ PDF ចូលគ្នា',
        shortDesc:
          'បញ្ចូលឯកសារ PDF ជាច្រើនចូលទៅក្នុងឯកសារតែមួយ ដោយអាចអូសរៀបចំលំដាប់តាមចិត្ត និងរក្សាគុណភាពដើម 100%។',
        categoryLabel: 'ឧបករណ៍ PDF',
      },
      compresspdf: {
        name: 'បង្រួមទំហំឯកសារ PDF',
        shortDesc:
          'បង្រួមទំហំឯកសារជាមួយកម្រិត ទាប (30-50%), មធ្យម (50-70%), និង ខ្ពស់ (70-90%) ដោយរក្សាគុណភាពខ្ពស់បំផុត។',
        categoryLabel: 'ឧបករណ៍ PDF',
      },
      json: {
        name: 'ធ្វើទ្រង់ទ្រាយ និងផ្ទៀងផ្ទាត់ JSON',
        shortDesc:
          'ផ្ទៀងផ្ទាត់, ធ្វើទ្រង់ទ្រាយ, បង្រួម និងពិនិត្យទិន្នន័យ JSON ដ៏ស្មុគស្មាញ រួមទាំងបង្ហាញទីតាំងកំហុស syntax។',
        categoryLabel: 'អ្នកអភិវឌ្ឍន៍',
      },
      password: {
        name: 'បង្កើតលេខសម្ងាត់សុវត្ថិភាព',
        shortDesc:
          'បង្កើតលេខសម្ងាត់កម្រិតសុវត្ថិភាពខ្ពស់ (cryptographic entropy) ដោយកំណត់និមិត្តសញ្ញា លេខ និងប្រវែងតាមតម្រូវការ។',
        categoryLabel: 'សុវត្ថិភាព',
      },
    },
    footer: {
      tagline: 'Moew Tools។ រាល់ដំណើរការទាំងអស់ត្រូវបានអនុវត្តដោយសុវត្ថិភាព 100% នៅក្នុងកម្មវិធីរុករករបស់អ្នក។',
    },
  },
};
