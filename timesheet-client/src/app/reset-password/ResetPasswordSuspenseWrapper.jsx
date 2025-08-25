import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordSuspenseWrapper() {
  return (
    <Suspense fallback={<div className=" flex items-center justify-center text-gray-600">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
