import React, { useState } from 'react'

const Contact_Form = () => {
  const [form, setForm] = useState({ name: '', email: '', feedback: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStatus('Thank you for your feedback!');
      setForm({ name: '', email: '', feedback: '' });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="w-full flex items-center justify-center py-12 relative">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl p-8 bg-black/30 flex-col flex items-center gap-6 rounded-2xl shadow-blue-600 shadow-2xl backdrop-blur-md relative">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Feedback</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            name="name"
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder:text-gray-400 focus:outline-none text-base md:text-lg"
          />
          <input
            name="email"
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder:text-gray-400 focus:outline-none text-base md:text-lg"
          />
          <textarea
            name="feedback"
            placeholder="Your Feedback"
            value={form.feedback}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder:text-gray-400 focus:outline-none resize-vertical text-base md:text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer bg-red-500 hover:bg-red-600 transition-all text-white font-bold py-3 rounded-lg mt-2 text-lg md:text-xl shadow-md"
          >
            Submit Feedback
          </button>
        </form>
        {status && <div className="text-green-400 text-center mt-2 text-base md:text-lg font-semibold">{status}</div>}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl z-20">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-white font-semibold">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Contact_Form
