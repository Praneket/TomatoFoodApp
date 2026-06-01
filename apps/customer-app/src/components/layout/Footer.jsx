import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube } from 'react-icons/fi';
import { motion } from 'framer-motion';

const LINKS = {
  Company:  [{ to: '/about', label: 'About Us' }, { to: '/careers', label: 'Careers' }, { to: '/blog', label: 'Blog' }],
  Support:  [{ to: '/help', label: 'Help Center' }, { to: '/contact', label: 'Contact Us' }, { to: '/faq', label: 'FAQ' }],
  Legal:    [{ to: '/privacy', label: 'Privacy Policy' }, { to: '/terms', label: 'Terms of Service' }],
};

const SOCIALS = [
  { icon: FiInstagram, href: '#', label: 'Instagram' },
  { icon: FiTwitter,   href: '#', label: 'Twitter' },
  { icon: FiFacebook,  href: '#', label: 'Facebook' },
  { icon: FiYoutube,   href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-dark text-white mt-auto">
      <div className="container-app py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🍅</span>
              <span className="font-display font-bold text-xl text-gradient">Tomato</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Delivering happiness, one meal at a time. Order from 500+ restaurants near you.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <motion.a key={label} href={href} whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-primary/80 flex items-center justify-center transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-gray-400 hover:text-primary text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Tomato. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Made with</span>
            <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>❤️</motion.span>
            <span>using MERN Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
