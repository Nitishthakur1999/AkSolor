import PageHeader from '../components/PageHeader'
import LeadershipMessage from '../components/LeadershipMessage'
import directorPhoto from '../assets/director_1.png'

export default function DirectorMessage() {
    return (
        <>
            <PageHeader
                compact
                eyebrow="Director's Message"
                title="Built on trust,"
                highlight="powered by people."
            />

            <LeadershipMessage
                index={3}
                total={3}
                name="Vivek Grovar"
                role="Director"
                photoSrc={directorPhoto}
                photoAlt="Vivek Grovar, Director of AKS Solar Systems Private Limited"
                quote="No two homes have the same roof, the same load, or the same needs — and no two of our installations look the same either."
                paragraphs={[
                    "As Director, I work closely with our field teams to make sure every survey, design, and installation is treated as its own project, not a copy-paste job.",
                    "We take the time to understand shading patterns, roof strength, and daily power usage before a single panel goes up, because a system that isn't planned properly ends up costing our clients more in the long run. That attention to detail, at every single site, is what I hold our team to.",
                ]}
                glow="right"
            />
        </>
    )
}