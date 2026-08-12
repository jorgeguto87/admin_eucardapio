import { forwardRef } from 'react'

const Select = forwardRef(({ label, error, className = '', children, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <select ref={ref} className={`input ${error ? 'border-danger' : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <p className="text-danger text-xs mt-1">{error}</p>}
  </div>
))

Select.displayName = 'Select'
export default Select
