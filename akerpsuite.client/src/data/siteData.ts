export const mainNav = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Projects', href: '/gallery' },
    { label: 'Careers', href: '/careers' },
]
// data/siteData.js me
export const messagesDropdown = [
    { label: "Founder's Message", desc: "A note from our founder", href: "/messages/founder" },
    { label: "CMD's Message", desc: "A note from the Managing Director", href: "/messages/cmd" },
    { label: "Director's Message", desc: "A note from leadership", href: "/messages/director" },
];

export const servicesDropdown = [
    { label: 'PM Surya Ghar Muft Bijli Yojna', desc: 'On Grid & Hybrid Rooftop Solar System', href: '/services' },
    { label: 'Commercial and Industrial Solar Solutions', desc: 'High-capacity systems for business', href: '/services' },
    { label: 'Ground Mounted Solar Projects', desc: 'Large-scale open-land installs', href: '/services' },
    { label: 'Solar Street Lights', desc: 'CSR & community projects', href: '/services' },
    { label: 'Repair & Maintenance Services', desc: 'Keep your system running at peak', href: '/services' },
    { label: 'Retail', desc: 'Modules, inverters, ACDB, DCDB & more', href: '/services' },
    { label: 'How It Works', desc: 'Survey to switch-on, in 4 steps', href: '/services#process' },
]

export const companyDropdown = [
    { label: 'Why AKS Solar', desc: 'What sets us apart', href: '/#why' },
    { label: 'Our Work', desc: 'Before & after installs', href: '/gallery' },
    { label: 'Photo Gallery', desc: 'Browse our install photos', href: '/gallery#photo-gallery' },
    { label: 'Our Team', desc: 'Meet the people behind the work', href: '/about#team' },
    { label: 'Highlights', desc: 'Watch our highlights reel', href: '/about#highlights' },
    { label: 'Client Reviews', desc: 'Stories from across HP', href: '/#testimonials' },
    { label: 'FAQ', desc: 'Common questions answered', href: '/contact#faq' },
]

// Footer sitemap — grouped by page.
export const footerLinks = {
    Company: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Team', href: '/about#team' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
    ],
    Services: [
        { label: 'PM Surya Ghar Muft Bijli Yojna', href: '/services' },
        { label: 'Commercial and Industrial Solar', href: '/services' },
        { label: 'Ground Mounted Solar Projects', href: '/services' },
        { label: 'Solar Street Lights', href: '/services' },
        { label: 'Repair & Maintenance', href: '/services' },
        { label: 'Retail', href: '/services' },
    ],
    Explore: [
        { label: 'Our Projects', href: '/gallery' },
        { label: 'Client Reviews', href: '/#testimonials' },
        { label: 'FAQ', href: '/contact#faq' },
        { label: 'Get a Free Quote', href: '/contact' },
    ],
}

export const whyCards = [
    { icon: 'fa-drafting-compass', title: 'Design & Consultancy', text: 'Feasibility studies, project planning, and design optimization for solar systems tailored to your site.' },
    { icon: 'fa-tools', title: 'Install & Maintain', text: 'Full installation and ongoing maintenance of solar panels, thermal systems, and related components.' },
    { icon: 'fa-flask', title: 'R&D Focused', text: 'Continuous research into innovative solar technologies, focused on efficiency and renewable adoption.' },
    { icon: 'fa-building', title: 'Construction & Civil', text: 'Beyond solar, we undertake residential, commercial, and civil engineering construction projects.' },
]

export const services = [
    {
        tag: 'Government Scheme', title: 'PM Surya Ghar Muft Bijli Yojna', icon: 'fa-solar-panel', iconBg: 'var(--gold)',
        img: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/08/WhatsApp-Image-2023-08-27-at-21.30.30-300x224.jpg',
        fallback: 'linear-gradient(135deg,#E4FF4E,#FF4D2E)',
        desc: 'Subsidised On Grid Rooftop Solar System and Hybrid Rooftop Solar System under the PM Surya Ghar Muft Bijli Yojna.',
    },
    {
        tag: 'Business', title: 'Commercial and Industrial Solar Solutions', icon: 'fa-building', iconBg: 'var(--charcoal)',
        img: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/09/Good-morning-quotes-facebook-post-5.jpg',
        fallback: 'linear-gradient(135deg,#585B70,#08090D)',
        desc: 'High-capacity solar systems designed for factories, offices, and commercial establishments to cut operational power costs.',
    },
    {
        tag: 'Ground-Mounted', title: 'Ground Mounted Solar Projects', icon: 'fa-layer-group', iconBg: 'var(--slate)',
        img: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/09/Ground-Mounted-Solar-Power-Plant-1024x766.jpg',
        fallback: 'linear-gradient(135deg,#94A3B8,#64748B)',
        desc: 'Large-scale ground-mounted solar arrays for institutions and businesses with available open land.',
    },
    {
        tag: 'Public Lighting', title: 'Solar Street Lights', icon: 'fa-lightbulb', iconBg: 'var(--green)',
        img: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/09/Good-morning-quotes-facebook-post-4-1-300x251.jpg',
        fallback: 'linear-gradient(135deg,#00F0C8,#00B79B)',
        desc: 'Solar street lighting installations for CSR initiatives and community projects — self-sufficient, low upkeep public lighting.',
    },
    {
        tag: 'Service', title: 'Repair & Maintenance Services', icon: 'fa-tools', iconBg: 'var(--gold-deep)',
        img: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/08/WhatsApp-Image-2023-08-27-at-20.17.031-1.jpg',
        fallback: 'linear-gradient(135deg,#E4FF4E,#FF4D2E)',
        desc: 'Ongoing repair and maintenance support to keep your solar system running at peak performance year-round.',
    },
    {
        tag: 'Retail', title: 'Retail', icon: 'fa-store', iconBg: 'var(--charcoal-soft)',
        img: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/09/Off-Grid--1024x766.jpg',
        fallback: 'linear-gradient(135deg,#585B70,#08090D)',
        desc: 'Modules, inverters, structures, ACDB, DCDB, wires, and uni-directional tested meters — sold direct.',
        subItems: [
            { name: 'Modules', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=70&auto=format&fit=crop' },
            { name: 'Inverters', img: 'https://images.unsplash.com/photo-1620207418302-439b387441b0?w=400&q=70&auto=format&fit=crop' },
            { name: 'Structure — RCC, Tin Shed', img: 'https://images.unsplash.com/photo-1622708853896-aa3274d7e74c?w=400&q=70&auto=format&fit=crop' },
            { name: 'ACDB', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=70&auto=format&fit=crop' },
            { name: 'DCDB', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=70&auto=format&fit=crop' },
            { name: 'Wires', img: 'https://images.unsplash.com/photo-1559302995-f1d6e557869f?w=400&q=70&auto=format&fit=crop' },
            { name: 'Uni-Directional tested Meter', img: 'https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?w=400&q=70&auto=format&fit=crop' },
        ],
        detailImg: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/09/Off-Grid--1024x766.jpg',
    },
]

export const impactStats = [
    { target: 2023, label: 'Year incorporated' },
    { target: 6, label: 'Valued clients served' },
    { target: 4, label: 'States & UTs reached' },
    { target: 1, label: 'Sister concern firm' },
    { target: 2, label: 'Director-led teams' },
]

export const processSteps = [
    { num: '01', icon: '📍', title: 'Free Site Survey', desc: 'Our engineer visits, assesses your roof, shading, and load — at zero cost to you.' },
    { num: '02', icon: '📐', title: 'Custom Design', desc: 'We generate a precision energy model and layout, tailored to your building and usage.' },
    { num: '03', icon: '⚙️', title: 'Installation', desc: 'Our technicians install, wire, and commission your system with minimal disruption to your daily routine.' },
    { num: '04', icon: '☀️', title: 'Generate & Save', desc: 'Your system starts producing clean energy immediately — reducing electricity costs and contributing to a sustainable future.' },
]

export const galleryItems = [
    {
        title: 'Roof Top Solar Power Plant', loc: 'Residential & Commercial',
        before: 'https://images.unsplash.com/photo-1622708853896-aa3274d7e74c?w=400&q=70&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1592833167665-ebf9a8a6ca77?w=400&q=70&auto=format&fit=crop',
    },
    {
        title: 'Ground Mounted Solar Power Project', loc: 'Institutional & Industrial',
        before: 'https://images.unsplash.com/photo-1632838815048-3aebcd636990?w=400&q=70&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&q=70&auto=format&fit=crop',
    },
    {
        title: 'Off Grid Solar Power Plant', loc: 'Remote & Rural Areas',
        before: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=70&auto=format&fit=crop',
        after: 'https://images.unsplash.com/photo-1592839961540-990ea2c69c9f?w=400&q=70&auto=format&fit=crop',
    },
]

export const photoGalleryItems = [
    { wide: true, caption: 'Kullu Valley Rooftop Array', alt: 'Rooftop solar array overlooking a valley', img: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=900&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#E4FF4E,#08090D)' },
    { wide: false, caption: 'Monocrystalline Cell Detail', alt: 'Close-up of solar panel cells', img: 'https://images.unsplash.com/photo-1591964006776-90129a48d2f3?w=600&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#15293b,#0d1b28)' },
    { wide: false, caption: 'Mounting & Bracket Install', alt: 'Technician working on panel mounting', img: 'https://images.unsplash.com/photo-1559302995-f1d6e557869f?w=600&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#64748B,#4B4E5E)' },
    { wide: false, caption: 'Inverter & Wiring Setup', alt: 'Solar inverter and wiring setup', img: 'https://images.unsplash.com/photo-1620207418302-439b387441b0?w=600&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#00F0C8,#00B79B)' },
    { wide: true, caption: 'Completed Residential Install', alt: 'Completed rooftop solar installation', img: 'https://images.unsplash.com/photo-1610016302534-6f67f1c968d8?w=900&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#E4FF4E,#FF4D2E)' },
    { wide: false, caption: 'Hillside Home Install', alt: 'Solar panels mounted on a hillside home', img: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=600&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#1d3a52,#0d1b28)' },
    { wide: false, caption: 'Site Survey In Progress', alt: 'Engineer conducting a site survey', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#94A3B8,#64748B)' },
    { wide: false, caption: 'Panels Under Clear Skies', alt: 'Solar panels against a clear sky', img: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=70&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#E4FF4E,#08090D)' },
]

export const teamMembers = [
    { name: 'Vikram Thakur', role: 'Site Engineer', bio: 'Leads on-site surveys and installation quality across every HP project.', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=75&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#E4FF4E,#08090D)' },
    { name: 'Rakesh Sharma', role: 'Electrical Technician', bio: 'Handles wiring, inverter commissioning, and net-metering setup.', img: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=75&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#585B70,#08090D)' },
    { name: 'Priya Negi', role: 'Design & Feasibility', bio: 'Runs energy modeling and system layout for every custom design.', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=75&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#00F0C8,#00B79B)' },
    { name: 'Anjali Chauhan', role: 'Client Relations', bio: 'Your point of contact from first enquiry through after-sales support.', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=75&auto=format&fit=crop', fallback: 'linear-gradient(135deg,#94A3B8,#64748B)' },
]

export const partners = ['KLK Ventures', 'Cognitive Energy', 'Ritika Systems', 'Chikra Enterprises', 'Inter Solar Systems', 'Vanersena Services']

export const testimonials = [
    {
        text: 'Everyone from the first phone call to installation was a pleasure to deal with. All requests were handled promptly, pricing was competitive, and the work was completed with very little fuss.',
        name: 'Mr. Kuldeep Chandel', loc: 'Jhandhutta, Bilaspur',
        avatar: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/08/cust1-150x150.jpg', fallback: 'var(--gold)',
    },
    {
        text: 'Going solar with AKS was a great experience. The sales staff and local installers were professional throughout, and I was impressed with the care taken to finish the job cleanly.',
        name: 'Dr. Shiv Kumar', loc: 'Nagchala',
        avatar: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/08/cust2-150x150.jpg', fallback: 'var(--green)',
    },
]

export const faqItems = [
    { q: 'What services does AKS Solar Systems offer?', a: 'We design, install, and maintain solar power plants (on-grid and off-grid), rooftop and ground-mounted systems, solar geysers, and solar street lights — along with consultancy and feasibility studies for solar projects.' },
    { q: 'Do you only work in Himachal Pradesh?', a: "We're based in Sunder Nagar, Mandi, Himachal Pradesh, but we've completed projects for clients in Noida, Chandigarh, Delhi, and Amroha (UP) as well." },
    { q: 'Can you handle construction beyond solar?', a: 'Yes. Alongside solar, we undertake residential, commercial, and industrial construction, including civil engineering projects, general contracting, and architectural and engineering services.' },
    { q: 'How do I get a quote or site survey?', a: "Fill out the enquiry form below or call us directly. We'll arrange a consultation to understand your site and requirements before proposing a system." },
    { q: 'Is AKS Solar Systems a registered company?', a: 'Yes — AKS Solar Systems Private Limited was incorporated on 26th May 2023 under the Companies Act, 2013, with CIN U35105HP2023PTC010123.' },
]

export const tickerItems = [
    'Government subsidy available on solar installation',
    'Free site survey & consultation',
    'Up to 90% reduction in electricity bills',
    'Solar power plants, geysers & street lights',
    'Call now: +91-9805763000',
]

export const CONTACT = {
    address1: 'House No. 67-A/4, NH-21, Near IDBI Bank, Bhojpur',
    address2: 'Sunder Nagar, Distt. Mandi, Himachal Pradesh – 175002',
    tel: '01907-265350',
    mobiles: '+91-9805763000, 9418060350, 8988353500',
    email: 'akssolarsystems@gmail.com',
    hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
    whatsapp: 'https://wa.me/919805763000',
    whatsappPrefilled: "https://wa.me/918091476300?text=Hi%2C%20I'd%20like%20to%20know%20more%20about%20your%20solar%20services.",
    facebook: 'https://www.facebook.com/akssolarsystemsprivatelimited',
    youtube: 'https://youtube.com/@AKSSOLARSYSTEMSPRIVATELIMITED',
    mapEmbed: 'https://maps.google.com/maps?q=HOUSE%20NO.%2067-A%2F4%2C%20NH-21%2C%20NEAR%20IDBI%20BANK%20BHOJPUR%20SUNDER%20NAGAR%20DISTT.%20MANDI%20HIMACHAL%20PRADESH%20PIN-175002&t=m&z=13&output=embed&iwloc=near',
    videoSrc: 'https://akssolarsystemsprivatelimited.com/wp-content/uploads/2023/08/AKA-WEBSITE-VIDEO.mp4',
}