<template>
  <div class="project-list">
    <el-card shadow="always">
      <template #header>
        <div class="card-header">
          <span>项目列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新增项目
          </el-button>
        </div>
      </template>

      <!-- 搜索筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="mb-4">
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.project_name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" style="width: 200px;">
            <el-option label="全部" value="" />
            <el-option label="规划中" value="planning" />
            <el-option label="进行中" value="active" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="projects" style="width: 100%">
        <el-table-column prop="project_id" label="项目ID" width="80" />
        <el-table-column prop="project_name" label="项目名称" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="120" />
        <el-table-column prop="end_date" label="结束日期" width="120" />
        <el-table-column prop="budget" label="预算" width="120">
          <template #default="scope">
            ¥{{ formatBudget(scope.row.budget) }}
          </template>
        </el-table-column>
        <el-table-column prop="participant_count" label="参与人数" width="100" />
        <el-table-column label="进度" width="150">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.progress || 0"
              :stroke-width="8"
              :status="getProgressStatus(scope.row.progress)"
            >
              <template #default="{ percentage }">
                <span class="progress-text">{{ percentage }}%</span>
              </template>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button type="warning" link size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增项目' : '编辑项目'"
      width="600px"
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="项目名称" prop="project_name">
          <el-input v-model="projectForm.project_name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="projectForm.start_date"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker
            v-model="projectForm.end_date"
            type="date"
            placeholder="选择结束日期"
            :disabled-date="(time) => time.getTime() < new Date(projectForm.start_date).getTime()"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-select v-model="projectForm.status" placeholder="请选择项目状态">
            <el-option label="规划中" value="planning" />
            <el-option label="进行中" value="active" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目预算" prop="budget">
          <el-input
            v-model.number="projectForm.budget"
            type="number"
            placeholder="请输入项目预算"
            prefix-icon="el-icon-money"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElProgress, ElTag } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import projectApi from '../api/projectApi'

export default {
  name: 'ProjectList',
  components: {
    Plus,
    ElProgress,
    ElTag
  },
  setup() {
    const router = useRouter()
    
    // 项目列表数据
    const projects = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    
    // 搜索表单
    const searchForm = reactive({
      project_name: '',
      status: ''
    })
    
    // 对话框相关
    const dialogVisible = ref(false)
    const dialogType = ref('create')
    const projectFormRef = ref(null)
    
    // 表单数据
    const projectForm = reactive({
      project_id: null,
      project_name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planning',
      budget: null
    })
    
    // 表单验证规则
    const rules = {
      project_name: [
        { required: true, message: '请输入项目名称', trigger: 'blur' },
        { min: 1, max: 100, message: '项目名称长度在 1 到 100 个字符', trigger: 'blur' }
      ],
      start_date: [
        { required: true, message: '请选择开始日期', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择项目状态', trigger: 'change' }
      ],
      budget: [
        { required: true, message: '请输入项目预算', trigger: 'blur' },
        { type: 'number', min: 0, message: '预算不能为负数', trigger: 'blur' }
      ]
    }
    
    // 获取项目列表
    const fetchProjects = async () => {
      try {
        const response = await projectApi.getProjects({
          page: currentPage.value,
          limit: pageSize.value,
          ...searchForm
        })
        projects.value = response.data
        total.value = response.pagination?.total || 0
        
        // 为每个项目计算进度（如果后端未提供）
        projects.value.forEach(project => {
          if (!project.progress) {
            project.progress = calculateProgress(project.start_date, project.end_date, project.status)
          }
        })
      } catch (error) {
        ElMessage.error('获取项目列表失败')
        console.error(error)
      }
    }
    
    // 计算项目进度
    const calculateProgress = (startDate, endDate, status) => {
      if (status === 'completed') return 100
      if (status === 'cancelled') return 0
      
      const start = new Date(startDate)
      const end = endDate ? new Date(endDate) : null
      const today = new Date()
      
      if (today < start) return 0
      if (end && today > end) return 100
      
      if (!end) return 50 // 无结束日期时显示50%
      
      const totalDays = (end - start) / (1000 * 60 * 60 * 24)
      const elapsedDays = (today - start) / (1000 * 60 * 60 * 24)
      return Math.round((elapsedDays / totalDays) * 100)
    }
    
    // 获取状态对应的标签类型
    const getStatusType = (status) => {
      const statusMap = {
        planning: 'info',
        active: 'success',
        paused: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        planning: '规划中',
        active: '进行中',
        paused: '已暂停',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    }
    
    // 获取进度状态
    const getProgressStatus = (progress) => {
      if (progress >= 100) return 'success'
      if (progress >= 80) return 'warning'
      return 'primary'
    }
    
    // 格式化预算
    const formatBudget = (budget) => {
      if (!budget) return '0.00'
      return budget.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1
      fetchProjects()
    }
    
    // 重置搜索
    const resetSearch = () => {
      Object.assign(searchForm, {
        project_name: '',
        status: ''
      })
      currentPage.value = 1
      fetchProjects()
    }
    
    // 处理新增项目
    const handleCreate = () => {
      dialogType.value = 'create'
      // 重置表单
      projectFormRef.value?.resetFields()
      Object.assign(projectForm, {
        project_id: null,
        project_name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        budget: null
      })
      dialogVisible.value = true
    }
    
    // 处理编辑项目
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      Object.assign(projectForm, row)
      // 处理日期格式
      if (row.start_date) projectForm.start_date = new Date(row.start_date)
      if (row.end_date) projectForm.end_date = new Date(row.end_date)
      dialogVisible.value = true
    }
    
    // 处理查看项目详情
    const handleView = (row) => {
      // 跳转到项目详情页面
      router.push(`/projects/${row.project_id}`)
    }
    
    // 处理删除项目
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除项目「${row.project_name}」吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await projectApi.deleteProject(row.project_id)
          ElMessage.success('删除成功')
          fetchProjects() // 重新获取列表
        } catch (error) {
          ElMessage.error('删除失败')
          console.error(error)
        }
      }).catch(() => {
        // 取消删除
      })
    }
    
    // 提交表单
    const handleSubmit = async () => {
      try {
        await projectFormRef.value.validate()
        
        // 处理日期格式
        const formData = { ...projectForm }
        if (formData.start_date) formData.start_date = formData.start_date.toISOString().split('T')[0]
        if (formData.end_date) formData.end_date = formData.end_date.toISOString().split('T')[0]
        
        if (dialogType.value === 'create') {
          await projectApi.createProject(formData)
          ElMessage.success('新增成功')
        } else {
          await projectApi.updateProject(formData.project_id, formData)
          ElMessage.success('更新成功')
        }
        
        dialogVisible.value = false
        fetchProjects() // 重新获取列表
      } catch (error) {
        if (error !== false) { // 排除表单验证失败的情况
          ElMessage.error(dialogType.value === 'create' ? '新增失败' : '更新失败')
          console.error(error)
        }
      }
    }
    
    // 分页相关
    const handleSizeChange = (size) => {
      pageSize.value = size
      fetchProjects()
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
      fetchProjects()
    }
    
    // 监听全局刷新事件
    const setupRefreshListener = () => {
      window.addEventListener('refresh-projects-data', fetchProjects)
    }

    // 初始化
    onMounted(() => {
      fetchProjects()
      setupRefreshListener()
    })
    
    return {
      projects,
      currentPage,
      pageSize,
      total,
      searchForm,
      dialogVisible,
      dialogType,
      projectFormRef,
      projectForm,
      rules,
      handleSearch,
      resetSearch,
      handleCreate,
      handleEdit,
      handleView,
      handleDelete,
      handleSubmit,
      handleSizeChange,
      handleCurrentChange,
      getStatusType,
      getStatusText,
      getProgressStatus,
      formatBudget
    }
  }
}
</script>

<style scoped>
.project-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 16px;
}

.progress-text {
  font-size: 12px;
  font-weight: bold;
}
</style>