import React, { useState } from 'react'
import emailjs from 'emailjs-com'

const Contact_Form = () => {
  const [form, setForm] = useState({ name: '', email: '', contact: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    emailjs.send('service_vjdi6lw', 'template_5jhlxu3', {
      name: form.name,
      email: form.email,
      message: form.contact
    }, 'tNhlsdTVrPKuvPYDW')
      .then(() => {
        setStatus('Message sent successfully!');
        setForm({ name: '', email: '', contact: '' });
      })
      .catch(() => {
        setStatus('Failed to send message. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="w-full flex items-center justify-center py-24 relative">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl p-8 bg-black/30 flex-col flex items-center gap-6 rounded-2xl shadow-blue-600 shadow-2xl backdrop-blur-md relative">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center w-full">Contact</h1>
        
        <div className="flex gap-6 mb-4 justify-center w-full ml-1">
          <div className="flex flex-col items-center" style={{ transform: 'translateX(-20px)' }}>
            <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center shadow-md mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24" strokeWidth={1.5}
                   stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 
                         2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 
                         0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 
                         00-2.25 2.25m19.5 0v.243a2.25 2.25 0 
                         01-.876 1.797l-7.5 6a2.25 2.25 0 
                         01-2.748 0l-7.5-6A2.25 2.25 0 012.25 
                         6.993V6.75" />
              </svg>
            </div>
            <span className="text-white text-sm font-semibold">pavithsingh@outlook.com</span>
          </div>

          <div className="flex flex-col items-center cursor-pointer" style={{ transform: 'translateX(-20px)' }}>
            <a href="tel:131423" className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center shadow-md mb-2" tabIndex={-1}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                   fill="currentColor" className="w-8 h-8 text-white">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 
                         1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 
                         1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 
                         3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 
                         2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
              </svg>
            </a>
            <span className="text-white text-sm font-semibold">13 14 23</span>
          </div>
        </div>

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
            name="contact"
            placeholder="Your Message"
            value={form.contact}
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
            Submit Message
          </button>
        </form>

        {status && (
          <div className={`text-center mt-2 text-base md:text-lg font-semibold ${status.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
            {status}
          </div>
        )}

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
  );
};

export default Contact_Form;