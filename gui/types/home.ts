export interface HeroData {
  id?: number;
  logoUrl: string;
  title: string;
  description: string;
}

export interface ServiceData {
  id: number;
  title: string;
  description: string;
  iconName: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface SocialLinkItem {
  id: string;
  iconName: string;
  url: string;
  label?: string;
}

export interface AboutUsData {
  id?: number;
  fullName: string;
  designation: string;
  bio: string;
  avatarUrl: string;
  email: string;
  phone: string;
  location: string;
  socialLinksJson?: string;
}
