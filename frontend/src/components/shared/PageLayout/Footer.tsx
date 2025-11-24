import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations('Footer');
  
  return (
    <footer className="footer">
        {t('all_rights_reserved')} &copy; Alyra {new Date().getFullYear()}
    </footer>
  )
}

export default Footer