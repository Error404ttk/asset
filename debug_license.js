
const LicenseType = {
    FREEWARE: 'Freeware',
    OPEN_SOURCE: 'Open Source',
    LICENSED: 'Licensed',
    SUBSCRIPTION: 'Subscription',
    POTENTIALLY_UNLICENSED: 'Potentially Unlicensed',
    UNKNOWN: 'Unknown'
};

const detectLicenseType = (softwareName, publisher, productKey) => {
    const name = softwareName.toLowerCase();
    const pub = publisher.toLowerCase();

    // Freeware patterns - Free to use software
    const freewarePatterns = [
        'chrome', 'google chrome', 'edge', 'microsoft edge', 'brave',
        'zoom', 'teams', 'microsoft teams', 'discord', 'slack',
        'anydesk', 'teamviewer free', 'vlc', 'winrar trial',
        'adobe reader', 'acrobat reader', 'foxit reader',
        'skype', 'line', 'telegram', 'whatsapp'
    ];

    // Open Source patterns
    const openSourcePatterns = [
        'linux', 'ubuntu', 'debian', 'centos', 'fedora',
        'firefox', 'mozilla firefox', 'chromium', 'libreoffice',
        'gimp', 'inkscape', 'blender', 'audacity',
        'vscode', 'visual studio code', 'atom', 'notepad++',
        'mysql', 'postgresql', 'mariadb', 'mongodb',
        'apache', 'nginx', 'wordpress', 'drupal',
        '7-zip', 'vlc media player'
    ];

    // Commercial software that requires license
    const commercialPatterns = [
        'windows', 'microsoft office', 'office 365', 'office 2019', 'office 2021',
        'adobe photoshop', 'adobe illustrator', 'adobe premiere', 'adobe acrobat pro',
        'autocad', 'sketchup', 'solidworks', 'matlab',
        'kaspersky', 'norton', 'mcafee', 'eset',
        'visual studio', 'jetbrains', 'intellij', 'pycharm'
    ];

    // 1. Check for Freeware
    if (freewarePatterns.some(pattern => name.includes(pattern))) {
        return LicenseType.FREEWARE;
    }

    // 2. Check for Open Source
    if (openSourcePatterns.some(pattern => name.includes(pattern))) {
        return LicenseType.OPEN_SOURCE;
    }

    // 3. Commercial Software Logic
    if (commercialPatterns.some(pattern => name.includes(pattern))) {
        // Check if it has a product key
        if (productKey && productKey.length > 5 && !productKey.includes('not found')) {
            return LicenseType.LICENSED;
        }
        // Check keywords in name indicating license
        if (name.includes('licensed') || name.includes('pro') || name.includes('enterprise') || name.includes('commercial')) {
            if (productKey && productKey.length > 5) return LicenseType.LICENSED;
            return LicenseType.POTENTIALLY_UNLICENSED;
        }
        if (productKey && productKey.length > 5) return LicenseType.LICENSED;
        return LicenseType.POTENTIALLY_UNLICENSED;
    }

    // 4. Fallback: If has key, assume licensed
    if (productKey && productKey.length > 5 && !productKey.includes('not found')) {
        return LicenseType.LICENSED;
    }

    return LicenseType.UNKNOWN;
};

const examples = [
    { name: "Adobe Acrobat Reader DC", key: "" },
    { name: "Adobe Acrobat Pro DC", key: "" },
    { name: "Adobe Acrobat Pro DC", key: "12345-ABCDE" },
    { name: "Adobe Acrobat Standard 2020", key: "" },
    { name: "Adobe Acrobat XI Pro", key: "" }
];

console.log("--- Testing License Logic ---");
examples.forEach(ex => {
    console.log(`Name: '${ex.name}', Key: '${ex.key}' \n   -> Result: ${detectLicenseType(ex.name, "Adobe", ex.key)}`);
});
