export const config = {
  aws: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
    appsync: {
      graphqlEndpoint: process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT || '',
      apiKey: process.env.NEXT_PUBLIC_AWS_APPSYNC_API_KEY || ''
    },
    cognito: {
      identityPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID || '',
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID || '',
      userPoolWebClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_ID || '',
      userPoolWebClientSecret: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_SECRET || ''
    },
    storageBucket: process.env.NEXT_PUBLIC_AWS_STORAGE_BUCKET || '',
    cookieDomain: process.env.NEXT_PUBLIC_AWS_COOKIE_DOMAIN || 'localhost'
  }
}; 