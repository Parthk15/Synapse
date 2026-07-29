"""Initial schema with users, papers, and paper_chunks storing embedding vectors

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-29

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Create papers table
    op.create_table(
        'papers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('storage_path', sa.String(length=512), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('page_count', sa.Integer(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_papers_user_id'), 'papers', ['user_id'], unique=False)

    # 3. Create paper_chunks table
    op.create_table(
        'paper_chunks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('paper_id', sa.String(length=36), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('embedding', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_paper_chunks_paper_id'), 'paper_chunks', ['paper_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_paper_chunks_paper_id'), table_name='paper_chunks')
    op.drop_table('paper_chunks')
    op.drop_index(op.f('ix_papers_user_id'), table_name='papers')
    op.drop_table('papers')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
