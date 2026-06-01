'use client';
import ContractReports from '@/components/reports/ContractReports';

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Contract analytics and insights</p>
      </div>
      <ContractReports />
    </div>
  );
}
