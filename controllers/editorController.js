const editorService = require('../services/editorService');
const User = require('../schemas/userSchema');

class EditorController {
  // 게시글 목록 페이지
  async getEditorList(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const result = await editorService.getEditorList(page);
      
      res.render('editor/list', {
        title: 'Editor 게시판',
        currentPath: '/editor',
        ...result
      });
    } catch (error) {
      console.error('Editor 목록 조회 오류:', error);
      res.status(500).render('error', { 
        message: '게시글 목록을 불러오는 중 오류가 발생했습니다.' 
      });
    }
  }

  // 게시글 작성 페이지
  async getEditorWrite(req, res) {
    try {
      res.render('editor/write', {
        title: 'Editor 글쓰기',
        currentPath: '/editor'
      });
    } catch (error) {
      console.error('Editor 작성 페이지 오류:', error);
      res.status(500).render('error', { 
        message: '페이지를 불러오는 중 오류가 발생했습니다.' 
      });
    }
  }

  // 게시글 작성 처리
  async postEditorWrite(req, res) {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ 
          success: false, 
          message: '제목과 내용을 모두 입력해주세요.' 
        });
      }

      const user = await User.findById(req.session.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '로그인이 필요합니다. 먼저 로그인해주세요.',
        });
      }
      
      const editorData = {
        title: title.trim(),
        content,
        author: req.session.userId,
        authorName: user.name,
        authorUsername: user.username
      };

      const newPost = await editorService.createEditor(editorData);
      
      res.json({ 
        success: true, 
        message: '게시글이 성공적으로 작성되었습니다.',
        redirect: `/editor/view/${newPost._id}`
      });
    } catch (error) {
      console.error('Editor 작성 오류:', error);
      res.status(500).json({ 
        success: false, 
        message: '게시글 작성 중 오류가 발생했습니다.' 
      });
    }
  }

  // 게시글 상세 보기
  async getEditorView(req, res) {
    try {
      const { id } = req.params;
      const post = await editorService.getEditorById(id);
      
      if (!post) {
        return res.status(404).render('error', { 
          message: '게시글을 찾을 수 없습니다.' 
        });
      }

      res.render('editor/view', {
        title: post.title,
        currentPath: '/editor',
        post
      });
    } catch (error) {
      console.error('Editor 상세보기 오류:', error);
      res.status(500).render('error', { 
        message: '게시글을 불러오는 중 오류가 발생했습니다.' 
      });
    }
  }

  // 게시글 수정 페이지
  async getEditorEdit(req, res) {
    try {
      const { id } = req.params;
      const post = await editorService.getEditorById(id);
      
      if (!post) {
        return res.status(404).render('error', { 
          message: '게시글을 찾을 수 없습니다.' 
        });
      }

      // author가 ObjectId인지 문자열인지 확인하여 비교
      const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
      if (authorId !== req.session.userId) {
        return res.status(403).render('error', { 
          message: '수정 권한이 없습니다.' 
        });
      }

      res.render('editor/edit', {
        title: 'Editor 수정',
        currentPath: '/editor',
        post
      });
    } catch (error) {
      console.error('Editor 수정 페이지 오류:', error);
      res.status(500).render('error', { 
        message: '페이지를 불러오는 중 오류가 발생했습니다.' 
      });
    }
  }

  // 게시글 수정 처리
  async postEditorEdit(req, res) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ 
          success: false, 
          message: '제목과 내용을 모두 입력해주세요.' 
        });
      }

      await editorService.updateEditor(id, {
        title: title.trim(),
        content
      }, req.session.userId);
      
      res.json({ 
        success: true, 
        message: '게시글이 성공적으로 수정되었습니다.',
        redirect: `/editor/view/${id}`
      });
    } catch (error) {
      console.error('Editor 수정 오류:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || '게시글 수정 중 오류가 발생했습니다.' 
      });
    }
  }

  // 게시글 삭제
  async deleteEditor(req, res) {
    try {
      const { id } = req.params;
      await editorService.deleteEditor(id, req.session.userId);
      
      res.json({ 
        success: true, 
        message: '게시글이 성공적으로 삭제되었습니다.',
        redirect: '/editor'
      });
    } catch (error) {
      console.error('Editor 삭제 오류:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || '게시글 삭제 중 오류가 발생했습니다.' 
      });
    }
  }
}

module.exports = new EditorController(); 