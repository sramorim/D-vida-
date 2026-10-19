import next from 'eslint-config-next'

export default [
  ...next,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'android/**',
      '.github/**',
      'data/**',
      'reports/**',
      'reference-frames/**',
      'storage/**',
    ],
  },
]