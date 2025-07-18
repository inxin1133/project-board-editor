const Editor = require('../schemas/editorSchema');

class EditorService {
  // 게시글 목록 조회
  async getEditorList(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [posts, total] = await Promise.all([
      Editor.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name username'),
      Editor.countDocuments({ isDeleted: false })
    ]);

    return {
      posts,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  }

  // 게시글 상세 조회
  async getEditorById(id) {
    const post = await Editor.findById(id)
      .populate('author', 'name username')
      .where({ isDeleted: false });
    
    if (post) {
      await post.incrementViews();
    }
    
    return post;
  }

  // 게시글 작성
  async createEditor(data) {
    const post = new Editor(data);
    return await post.save();
  }

  // 게시글 수정
  async updateEditor(id, data, userId) {
    const post = await Editor.findById(id);
    
    if (!post) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    // author가 ObjectId인지 문자열인지 확인하여 비교
    const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
    if (authorId !== userId) {
      throw new Error('수정 권한이 없습니다.');
    }
    
    return await Editor.findByIdAndUpdate(id, data, { new: true });
  }

  // 게시글 삭제
  async deleteEditor(id, userId) {
    const post = await Editor.findById(id);
    
    if (!post) {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
    
    // author가 ObjectId인지 문자열인지 확인하여 비교
    const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
    if (authorId !== userId) {
      throw new Error('삭제 권한이 없습니다.');
    }
    
    return await Editor.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }
}

module.exports = new EditorService(); 