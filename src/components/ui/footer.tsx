import Image from "next/image";
import Link from "next/link";
import { Input } from "./input";
import { Button } from "./button";

export default function Footer() {
  return (
    <footer className="bg-[#152d42] text-gray-200 py-12 px-6 md:px-16 overflow-x-hidden font-gilroy">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
          {/* Left Section: Logo + Newsletter */}
          <div className="flex-1 max-w-md space-y-4">
            <Image
              src="/images/logos/mefie-logo-2.svg"
              alt="Mefie Logo"
              width={120}
              height={40}
              className="w-auto h-10"
            />

            <p className="text-sm text-gray-100 leading-relaxed">
              Join our newsletter to stay up to date on features and releases.
            </p>

            {/* Newsletter Form */}
            <form className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-md border border-gray-100 bg-transparent px-4 py-2.5 text-sm text-gray-100 placeholder-gray-100 focus:outline-none focus:ring-2 focus:ring-[#93c01f] focus:border-transparent"
              />
              <Button
                type="submit"
                className="rounded-md bg-[#93c01f] hover:bg-[#a3d65c] text-white font-medium px-6 py-2.5 text-sm transition-colors"
              >
                Subscribe
              </Button>
            </form>

            <p className="text-xs text-gray-100 leading-relaxed">
              By subscribing you agree to with our{" "}
              <Link href="#" className="underline hover:text-[#93c01f]">
                Privacy Policy
              </Link>{" "}
              and provide consent to receive updates from our company.
            </p>
          </div>

          {/* Right Section: Three Columns */}
          <div className="flex flex-col sm:flex-row gap-8 lg:gap-16">
            {/* Company Info */}
            <div>
              <h4 className="font-semibold text-white text-base mb-4">
                Company Info
              </h4>
              <ul className="space-y-3 text-sm text-gray-100">
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#93c01f] transition-colors"
                  >
                    About us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#93c01f] transition-colors"
                  >
                    Discover
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#93c01f] transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-[#93c01f] transition-colors"
                  >
                    Terms and conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white text-base mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-gray-100">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#93c01f] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-semibold text-white mb-3">Follow Us</h4>
            <ul className="space-y-3 text-sm text-gray-100">
              <li className="flex items-center gap-2">
                <Image
                  src="/images/icons/Facebook.svg"
                  alt="Facebook"
                  width={24}
                  height={24}
                />{" "}
                <Link href="#" className="hover:text-[#A3D65C]">
                  Facebook
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Image
                  src="/images/icons/Instagram.svg"
                  alt="Instagram"
                  width={24}
                  height={24}
                />{" "}
                <Link href="#" className="hover:text-[#A3D65C]">
                  Instagram
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Image
                  src="/images/icons/X.svg"
                  alt="Twitter"
                  width={24}
                  height={24}
                />{" "}
                <Link href="#" className="hover:text-[#A3D65C]">
                  X
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Image
                  src="/images/icons/Linkedin.svg"
                  alt="LinkedIn"
                  width={24}
                  height={24}
                />{" "}
                <Link href="#" className="hover:text-[#A3D65C]">
                  LinkedIn
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Image
                  src="/images/icons/Youtube.svg"
                  alt="YouTube"
                  width={24}
                  height={24}
                />{" "}
                <Link href="#" className="hover:text-[#A3D65C]">
                  YouTube
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* --- Footer Bottom --- */}
        <div className="border-t border-gray-600 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-100">
          <p>© 2025 Mefie. All rights reserved.</p>
          <Link
            href="#"
            className="underline hover:text-[#93c01f] transition-colors mt-3 sm:mt-0"
          >
            Cookies Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
