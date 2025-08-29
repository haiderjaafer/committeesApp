from sqlalchemy.ext.asyncio import AsyncSession

from app.models.committee import Committee, CommitteeCreate



class CommitteeService:
    @staticmethod
    async def insertCommitteesDocsData(db: AsyncSession, CommitteeCreateArgs:CommitteeCreate ) -> int:
        newCommitteeObject = Committee(**CommitteeCreateArgs.model_dump())
        db.add(newCommitteeObject)
        await db.commit()
        await db.refresh(newCommitteeObject)
        return newCommitteeObject.id
    