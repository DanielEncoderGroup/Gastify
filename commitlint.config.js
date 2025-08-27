module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Corrección de bugs
        'docs',     // Documentación
        'style',    // Formateo, semicolons, etc
        'refactor', // Refactorización
        'perf',     // Mejoras de performance
        'test',     // Tests
        'chore',    // Mantenimiento
        'ci',       // Cambios en CI
        'build',    // Cambios en el build
        'revert'    // Revert de commits
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72]
  }
}