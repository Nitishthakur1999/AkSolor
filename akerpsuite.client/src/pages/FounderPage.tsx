import PageHeader from '../components/PageHeader'
import LeadershipMessage from '../components/LeadershipMessage'
import founderPhoto from '../assets/founder.png'

export default function FounderMessage() {
    return (
        <>
            <PageHeader
                compact
                eyebrow="Founder's Message"
                title="Focus on being"
                highlight="productive, not busy."
            />

            <LeadershipMessage
                index={2}
                total={3}
                name="Asha Sharma"
                role="Founder"
                photoSrc={founderPhoto}
                photoAlt="Mrs. Asha Sharma, Founder of AKS Solar Systems Private Limited"
                quote="We're not here to sell panels. We're here to bring dependable power to homes that have waited long enough for it."
                paragraphs={[
                    "We take this opportunity to thank our valued customers, whose continued patronage and confidence in our products inspires us to extend the best of services.",
                    "Being dedicated to taking AKS Solar Systems Private Limited to rural areas, we focus on addressing customer needs through rugged, efficient, reliable, and economic renewable energy solutions.",
                ]}
                glow="left"
                reverse
            />
        </>
    )
}