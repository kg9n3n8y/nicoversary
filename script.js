document.addEventListener('DOMContentLoaded', function() {
    // 定数と変数の初期化
    const API_BASE_URL = 'https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search';
    const resultsContainer = document.getElementById('results-container');
    const currentDateElement = document.getElementById('current-date');
    const prevDayButton = document.getElementById('prev-day');
    const nextDayButton = document.getElementById('next-day');
    const tagSelect = document.getElementById('tag-select');
    const customTagInput = document.getElementById('custom-tag');
    const searchButton = document.getElementById('search-button');
    const titleLogo = document.getElementById('title-logo');
    const loadingElement = document.getElementById('loading');
    const searchStatus = document.getElementById('search-status');
    
    let currentDate = new Date();
    let currentTag = '';
    
    // 日付のフォーマット関数
    function formatDate(date) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    }
    
    // URLから日付とタグを解析する関数
    function parseUrlParams() {
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(part => part !== '');
      
      if (pathParts.length >= 3 && !isNaN(pathParts[0])) {
        // 日付パラメータがある場合
        const year = parseInt(pathParts[0]);
        const month = parseInt(pathParts[1]) - 1;
        const day = parseInt(pathParts[2]);
        
        // 日付の有効性チェック
        if (year >= 2008 && year <= 2025 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          currentDate = new Date(year, month, day);
        }
        
        // タグパラメータがある場合
        if (pathParts.length >= 4) {
          currentTag = decodeURIComponent(pathParts[3]);
          
          // セレクトボックスに存在するタグなら選択する
          const tagOption = Array.from(tagSelect.options).find(option => option.value === currentTag);
          if (tagOption) {
            tagSelect.value = currentTag;
          } else {
            tagSelect.value = '';
            customTagInput.value = currentTag;
          }
        }
      }
      
      updateCurrentDateDisplay();
    }
    
    // URLを更新する関数
    function updateUrl() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      
      let newUrl = `/${year}/${month}/${day}`;
      if (currentTag) {
        newUrl += `/${encodeURIComponent(currentTag)}`;
      }
      
      history.pushState({}, '', newUrl);
    }
    
    // 現在の日付表示を更新
    function updateCurrentDateDisplay() {
      currentDateElement.textContent = formatDate(currentDate);
    }
    
    // 周年数を計算する関数
    function calculateAnniversary(postDate) {
      const today = new Date();
      const postYear = new Date(postDate).getFullYear();
      const thisYear = today.getFullYear();
      return thisYear - postYear;
    }
    
    // 動画を検索する関数
    async function searchVideos() {
      resultsContainer.innerHTML = '';
      loadingElement.style.display = 'flex';
      searchStatus.textContent = '検索中...';
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      
      // 検索クエリの構築
      let query = `startTime:${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} AND endTime:${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} AND viewCounter:>=10000`;
      
      if (currentTag) {
        query += ` AND tagsExact:${currentTag}`;
      }
      
      const params = new URLSearchParams({
        q: query,
        targets: 'title,description,tags',
        fields: 'contentId,title,viewCounter,startTime,thumbnailUrl',
        _sort: '-viewCounter',
        _limit: 100,
        _context: 'nicoversary'
      });
      
      try {
        const response = await fetch(`${API_BASE_URL}?${params}`);
        const data = await response.json();
        
        if (data.meta.status === 200) {
          displayResults(data.data);
          searchStatus.textContent = `${data.meta.totalCount}件の動画が見つかりました`;
        } else {
          throw new Error('API error: ' + data.meta.errorMessage);
        }
      } catch (error) {
        console.error('検索エラー:', error);
        searchStatus.textContent = 'エラーが発生しました。しばらく経ってから再度お試しください。';
      } finally {
        loadingElement.style.display = 'none';
      }
    }
    
    // 検索結果を表示する関数
    function displayResults(videos) {
      if (videos.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">該当する動画がありませんでした。</p>';
        return;
      }
      
      videos.forEach(video => {
        const postDate = new Date(video.startTime);
        const anniversary = calculateAnniversary(postDate);
        
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        
        videoCard.innerHTML = `
          <a href="https://www.nicovideo.jp/watch/${video.contentId}" target="_blank">
            <div class="video-thumbnail">
              <img src="${video.thumbnailUrl}" alt="${video.title}">
              <span class="anniversary-badge">${anniversary}周年</span>
            </div>
            <div class="video-info">
              <h3 class="video-title">${video.title}</h3>
              <div class="video-meta">
                <span>再生数: ${video.viewCounter.toLocaleString()}</span>
                <span>投稿: ${postDate.getFullYear()}/${(postDate.getMonth() + 1).toString().padStart(2, '0')}/${postDate.getDate().toString().padStart(2, '0')}</span>
              </div>
            </div>
          </a>
        `;
        
        resultsContainer.appendChild(videoCard);
      });
    }
    
    // イベントリスナーの設定
    prevDayButton.addEventListener('click', function() {
      currentDate.setDate(currentDate.getDate() - 1);
      updateCurrentDateDisplay();
      updateUrl();
      searchVideos();
    });
    
    nextDayButton.addEventListener('click', function() {
      currentDate.setDate(currentDate.getDate() + 1);
      updateCurrentDateDisplay();
      updateUrl();
      searchVideos();
    });
    
    searchButton.addEventListener('click', function() {
      const selectedTag = tagSelect.value;
      const customTag = customTagInput.value.trim();
      
      currentTag = selectedTag || customTag;
      updateUrl();
      searchVideos();
    });
    
    tagSelect.addEventListener('change', function() {
      if (tagSelect.value) {
        customTagInput.value = '';
      }
    });
    
    titleLogo.addEventListener('click', function() {
      currentDate = new Date();
      currentTag = '';
      tagSelect.value = '';
      customTagInput.value = '';
      updateCurrentDateDisplay();
      history.pushState({}, '', '/');
      searchVideos();
    });
    
    // ブラウザの戻る/進むボタンの処理
    window.addEventListener('popstate', function() {
      parseUrlParams();
      searchVideos();
    });
    
    // 初期化
    parseUrlParams();
    searchVideos();
  });
  