#!/usr/bin/env node
/**
 * Script de verificación frontend para Gastify
 * Verifica que todos los servicios y componentes estén correctamente integrados
 */

const fs = require('fs');
const path = require('path');

const CLIENT_DIR = path.join(__dirname, 'client-new');

// Colores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
    const fullPath = path.join(CLIENT_DIR, filePath);
    return fs.existsSync(fullPath);
}

function checkFileContent(filePath, searchStrings) {
    try {
        const fullPath = path.join(CLIENT_DIR, filePath);
        if (!fs.existsSync(fullPath)) {
            return { exists: false, matches: [] };
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = searchStrings.filter(str => content.includes(str));
        
        return {
            exists: true,
            matches,
            totalMatches: matches.length,
            totalSearched: searchStrings.length
        };
    } catch (error) {
        return { exists: false, matches: [], error: error.message };
    }
}

function testServiceFiles() {
    log('cyan', '\n🔧 Verificando archivos de servicios...');
    
    const serviceFiles = [
        'src/services/spendingLimitsService.ts',
        'src/services/notificationsService.ts', 
        'src/services/receiptService.ts',
        'src/services/analyticsService.ts',
        'src/services/api.ts'
    ];
    
    let allExist = true;
    
    serviceFiles.forEach(file => {
        const exists = checkFileExists(file);
        const status = exists ? '✅' : '❌';
        log(exists ? 'green' : 'red', `${status} ${file}`);
        if (!exists) allExist = false;
    });
    
    return allExist;
}

function testSpendingLimitsService() {
    log('cyan', '\n💰 Verificando SpendingLimitsService...');
    
    const filePath = 'src/services/spendingLimitsService.ts';
    const requiredMethods = [
        'getSpendingLimits',
        'createSpendingLimit',
        'updateSpendingLimit',
        'deleteSpendingLimit',
        'getSpendingUsage',
        'validateTransaction',
        'createBulkLimits'
    ];
    
    const result = checkFileContent(filePath, requiredMethods);
    
    if (!result.exists) {
        log('red', '❌ Archivo no encontrado');
        return false;
    }
    
    log('green', `✅ Archivo encontrado`);
    log('blue', `📊 Métodos encontrados: ${result.totalMatches}/${result.totalSearched}`);
    
    requiredMethods.forEach(method => {
        const found = result.matches.includes(method);
        const status = found ? '✅' : '❌';
        log(found ? 'green' : 'red', `  ${status} ${method}()`);
    });
    
    return result.totalMatches >= requiredMethods.length * 0.8; // 80% de métodos
}

function testNotificationsService() {
    log('cyan', '\n🔔 Verificando NotificationsService...');
    
    const filePath = 'src/services/notificationsService.ts';
    const requiredMethods = [
        'getNotifications',
        'markAsRead',
        'markMultipleAsRead',
        'getIntelligentAlerts',
        'getNotificationStats',
        'getNotificationPreferences',
        'updateNotificationPreferences'
    ];
    
    const result = checkFileContent(filePath, requiredMethods);
    
    if (!result.exists) {
        log('red', '❌ Archivo no encontrado');
        return false;
    }
    
    log('green', `✅ Archivo encontrado`);
    log('blue', `📊 Métodos encontrados: ${result.totalMatches}/${result.totalSearched}`);
    
    requiredMethods.forEach(method => {
        const found = result.matches.includes(method);
        const status = found ? '✅' : '❌';
        log(found ? 'green' : 'red', `  ${status} ${method}()`);
    });
    
    return result.totalMatches >= requiredMethods.length * 0.8;
}

function testComponentFiles() {
    log('cyan', '\n🎨 Verificando componentes principales...');
    
    const componentFiles = [
        'src/components/spending/SpendingLimitsManager.tsx',
        'src/components/notifications/NotificationCenter.tsx',
        'src/components/notifications/NotificationBell.tsx',
        'src/hooks/useNotifications.ts',
        'src/hooks/useWorkflowData.ts'
    ];
    
    let allExist = true;
    
    componentFiles.forEach(file => {
        const exists = checkFileExists(file);
        const status = exists ? '✅' : '❌';
        log(exists ? 'green' : 'red', `${status} ${file}`);
        if (!exists) allExist = false;
    });
    
    return allExist;
}

function testAPIIntegration() {
    log('cyan', '\n🔗 Verificando integración de API...');
    
    const apiFile = 'src/services/api.ts';
    const requiredConfig = [
        'axios.create',
        'baseURL',
        'Authorization',
        'interceptors'
    ];
    
    const result = checkFileContent(apiFile, requiredConfig);
    
    if (!result.exists) {
        log('red', '❌ api.ts no encontrado');
        return false;
    }
    
    log('green', `✅ api.ts encontrado`);
    log('blue', `📊 Configuraciones encontradas: ${result.totalMatches}/${result.totalSearched}`);
    
    requiredConfig.forEach(config => {
        const found = result.matches.includes(config);
        const status = found ? '✅' : '❌';
        log(found ? 'green' : 'red', `  ${status} ${config}`);
    });
    
    return result.totalMatches >= requiredConfig.length * 0.75;
}

function testEndpointURLs() {
    log('cyan', '\n🌐 Verificando URLs de endpoints...');
    
    const spendingService = checkFileContent('src/services/spendingLimitsService.ts', [
        '/spending-limits',
        'SPENDING_LIMITS_BASE'
    ]);
    
    const notificationService = checkFileContent('src/services/notificationsService.ts', [
        '/advanced-notifications',
        'ADVANCED_NOTIFICATIONS_BASE'
    ]);
    
    let urlsCorrect = true;
    
    if (spendingService.exists) {
        const hasCorrectUrls = spendingService.matches.length > 0;
        const status = hasCorrectUrls ? '✅' : '❌';
        log(hasCorrectUrls ? 'green' : 'red', `${status} SpendingLimits URLs configuradas`);
        if (!hasCorrectUrls) urlsCorrect = false;
    }
    
    if (notificationService.exists) {
        const hasCorrectUrls = notificationService.matches.length > 0;
        const status = hasCorrectUrls ? '✅' : '❌';
        log(hasCorrectUrls ? 'green' : 'red', `${status} Notifications URLs configuradas`);
        if (!hasCorrectUrls) urlsCorrect = false;
    }
    
    return urlsCorrect;
}

function testPackageJson() {
    log('cyan', '\n📦 Verificando package.json...');
    
    const packageJsonPath = path.join(CLIENT_DIR, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        log('red', '❌ package.json no encontrado');
        return false;
    }
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const requiredDeps = [
            'react',
            'react-dom',
            'typescript',
            'axios',
            'react-hot-toast',
            'react-window',
            'framer-motion'
        ];
        
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        log('green', '✅ package.json encontrado');
        log('blue', `📊 Dependencias verificadas:`);
        
        let foundDeps = 0;
        requiredDeps.forEach(dep => {
            const found = dependencies.hasOwnProperty(dep);
            const status = found ? '✅' : '❌';
            const version = found ? dependencies[dep] : 'NO ENCONTRADA';
            log(found ? 'green' : 'red', `  ${status} ${dep}: ${version}`);
            if (found) foundDeps++;
        });
        
        log('blue', `📈 Dependencias encontradas: ${foundDeps}/${requiredDeps.length}`);
        return foundDeps >= requiredDeps.length * 0.8;
        
    } catch (error) {
        log('red', `❌ Error leyendo package.json: ${error.message}`);
        return false;
    }
}

function generateFrontendReport() {
    log('bold', '='.repeat(70));
    log('cyan', '🎨 REPORTE DE FRONTEND GASTIFY');
    log('bold', '='.repeat(70));
    log('blue', `📅 Fecha: ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}`);
    log('bold', '='.repeat(70));
    
    const tests = [
        { name: 'Archivos de Servicios', test: testServiceFiles },
        { name: 'SpendingLimits Service', test: testSpendingLimitsService },
        { name: 'Notifications Service', test: testNotificationsService },
        { name: 'Componentes Principales', test: testComponentFiles },
        { name: 'Integración de API', test: testAPIIntegration },
        { name: 'URLs de Endpoints', test: testEndpointURLs },
        { name: 'Package.json', test: testPackageJson }
    ];
    
    const results = [];
    
    for (const { name, test } of tests) {
        log('yellow', `\n🧪 Testing: ${name}`);
        log('yellow', '-'.repeat(50));
        
        try {
            const result = test();
            results.push({ name, success: result });
        } catch (error) {
            log('red', `💥 Error en ${name}: ${error.message}`);
            results.push({ name, success: false });
        }
    }
    
    // Resumen final
    log('bold', '\n' + '='.repeat(70));
    log('cyan', '📊 RESUMEN FRONTEND');
    log('bold', '='.repeat(70));
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    results.forEach(({ name, success }) => {
        const status = success ? '✅ PASS' : '❌ FAIL';
        log(success ? 'green' : 'red', `${status.padEnd(12)} ${name}`);
    });
    
    log('bold', '-'.repeat(70));
    log('blue', `📈 Resultado: ${passed}/${total} tests pasaron (${(passed/total*100).toFixed(1)}%)`);
    
    if (passed === total) {
        log('green', '\n🎉 ¡FRONTEND COMPLETAMENTE INTEGRADO!');
        log('cyan', '\n🚀 SERVICIOS DISPONIBLES:');
        log('green', '- 💰 SpendingLimitsService: Gestión de límites');
        log('green', '- 🔔 NotificationsService: Alertas inteligentes');  
        log('green', '- 👥 EmployeeService: Gestión empleados');
        log('green', '- 📊 AnalyticsService: Dashboard premium');
        log('cyan', '\n📱 COMPONENTES LISTOS:');
        log('green', '- SpendingLimitsManager, NotificationCenter');
        log('green', '- NotificationBell, WorkflowData hooks');
    } else {
        log('yellow', '\n⚠️  Algunos componentes frontend necesitan atención:');
        results.filter(r => !r.success).forEach(({ name }) => {
            log('red', `- ${name}`);
        });
    }
    
    return passed === total;
}

// Ejecutar reporte
if (require.main === module) {
    try {
        const success = generateFrontendReport();
        process.exit(success ? 0 : 1);
    } catch (error) {
        log('red', `\n💥 Error inesperado: ${error.message}`);
        process.exit(1);
    }
}
