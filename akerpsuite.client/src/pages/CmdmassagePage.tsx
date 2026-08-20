import PageHeader from '../components/PageHeader'
import LeadershipMessage from '../components/LeadershipMessage'
import cmdPhoto from '../assets/director.png'

export default function CMDMessage() {
    return (
        <>
            <PageHeader
                compact
                eyebrow="CMD's Message"
                title="Growth means nothing"
                highlight="if it doesn't reach the last home."
            />

            <LeadershipMessage
                index={1}
                total={3}
                name="Kapil Sharma"
                role="CMD"
                photoSrc={cmdPhoto}
                photoAlt="Mr. Kapil Sharma, CMD of AKS Solar Systems Private Limited"
                quote="Our vision has never been just about installing panels — it's about making renewable energy reachable for every household, no matter how remote."
                paragraphs={[
                    "As we scale AKS Solar Systems across Himachal Pradesh and beyond, my focus stays on building a company that grows responsibly — investing in our people, strengthening our supply chain, and expanding into new districts without ever compromising on the quality our clients trust us for.",
                    "Every milestone we cross is measured not just in installations, but in the number of homes and communities that now run on dependable, clean power.",
                ]}
                glow="right"
            />
        </>
    )
}