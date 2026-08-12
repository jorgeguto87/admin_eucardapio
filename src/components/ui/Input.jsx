import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <input ref={ref} className={`input ${error ? 'border-danger' : ''} ${className}`} {...props} />
    {error && <p className="text-danger text-xs mt-1">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
