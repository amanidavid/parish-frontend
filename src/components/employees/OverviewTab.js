'use client';

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function OverviewTab({ employee }) {
  const info = [
    { label: 'First Name', value: employee?.first_name },
    { label: 'Middle Name', value: employee?.middle_name },
    { label: 'Last Name', value: employee?.last_name },
    { label: 'Gender', value: cap(employee?.gender) },
    { label: 'Date of Birth', value: employee?.date_of_birth },
    { label: 'Employee Number', value: employee?.employee_number },
    { label: 'Work Email', value: employee?.work_email },
    { label: 'Work Phone', value: employee?.work_phone },
    { label: 'Employment Type', value: cap(employee?.employment_type?.replace('_', ' ')) },
    { label: 'Employment Status', value: cap(employee?.employment_status?.replace('_', ' ')) },
    { label: 'Hire Date', value: employee?.hire_date },
    { label: 'Confirmation Date', value: employee?.confirmation_date },
    { label: 'Branch UUID', value: employee?.branch_uuid },
    { label: 'Department UUID', value: employee?.department_uuid },
    { label: 'Designation UUID', value: employee?.designation_uuid },
    { label: 'Manager UUID', value: employee?.manager_employee_uuid },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Employee Details</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {info.map(({ label, value }) => (
          <div key={label} className="px-6 py-4">
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
