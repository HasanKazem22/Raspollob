import React from "react";
import { SocialLinkItem } from "@/types/home";
import {
  LuTwitter,
  LuInstagram,
  LuGithub,
  LuLinkedin,
  LuFacebook,
  LuYoutube,
  LuDribbble,
  LuGlobe,
  LuMail,
  LuPhone,
  LuMapPin,
  LuSend,
  LuCode,
  LuPalette,
  LuSmartphone,
  LuLayoutTemplate,
  LuServer,
  LuMegaphone,
  LuLayers,
} from "react-icons/lu";

export interface SocialIconOption {
  name: string;
  label: string;
  placeholder: string;
}

export const socialIcons: SocialIconOption[] = [
  { name: "Twitter", label: "Twitter / X", placeholder: "https://x.com/username" },
  { name: "Instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { name: "Github", label: "GitHub", placeholder: "https://github.com/username" },
  { name: "Linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { name: "Facebook", label: "Facebook", placeholder: "https://facebook.com/username" },
  { name: "Youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { name: "Dribbble", label: "Dribbble", placeholder: "https://dribbble.com/username" },
  { name: "Globe", label: "Website", placeholder: "https://example.com" },
  { name: "Mail", label: "Email", placeholder: "mailto:hello@example.com" },
  { name: "Phone", label: "Phone", placeholder: "tel:+15551234567" },
  { name: "MapPin", label: "Location", placeholder: "123 Innovation Drive, NY" },
  { name: "Send", label: "Telegram", placeholder: "https://t.me/username" },
];

export const defaultSocialLinks: SocialLinkItem[] = [
  { id: "1", iconName: "Twitter", url: "https://x.com", label: "Twitter / X" },
  { id: "2", iconName: "Instagram", url: "https://instagram.com", label: "Instagram" },
  { id: "3", iconName: "Github", url: "https://github.com", label: "GitHub" },
  { id: "4", iconName: "Linkedin", url: "https://linkedin.com", label: "LinkedIn" },
];

export const socialIconMap: Record<string, React.ComponentType<any>> = {
  Twitter: LuTwitter,
  Instagram: LuInstagram,
  Github: LuGithub,
  Linkedin: LuLinkedin,
  Facebook: LuFacebook,
  Youtube: LuYoutube,
  Dribbble: LuDribbble,
  Globe: LuGlobe,
  Mail: LuMail,
  Phone: LuPhone,
  MapPin: LuMapPin,
  Send: LuSend,
};

export const serviceIconMap: Record<string, React.ComponentType<any>> = {
  Code: LuCode,
  Palette: LuPalette,
  Smartphone: LuSmartphone,
  Layout: LuLayoutTemplate,
  Server: LuServer,
  Megaphone: LuMegaphone,
  Layers: LuLayers,
};
