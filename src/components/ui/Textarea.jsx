import { forwardRef } from 'react'

const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} className={`input min-h-[90px] py-3 ${error ? 'border-danger' : ''} ${className}`} {...props} />
    {error && <p className="text-danger text-xs mt-1">{error}</p>}
  </div>
))

Textarea.displayName = 'Textarea'
export default Textarea
