const { API } = require('aws-amplify');
const { Amplify } = require('aws-amplify');
const dotenv = require('dotenv');

dotenv.config();

// Amplify 設定
Amplify.configure({
  aws_project_region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
  aws_cognito_identity_pool_id: process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID,
  aws_cognito_region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2',
  aws_user_pools_id: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
  aws_user_pools_web_client_id: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_WEB_CLIENT_ID
});

// テストユーザー作成
async function createTestUsers() {
  console.log('AWS Amplify でのテストデータ生成は、Amplify Admin UI または AWS Console から行ってください。');
  console.log('1. Amplify Console にアクセス');
  console.log('2. "User Management" または "Content" タブを選択');
  console.log('3. テストデータを手動で作成');
  process.exit(0);
}

// メイン関数
async function main() {
  try {
    await createTestUsers();
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

main(); 