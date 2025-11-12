<template>
  <div class="project-detail">
    <el-card shadow="always">
      <template #header>
        <div class="card-header">
          <span>项目详情 - {{ project.project_name }}</span>
          <el-button @click="$router.back()">返回列表</el-button>
        </div>
      </template>

      <!-- 项目基本信息 -->
      <div class="basic-info">
        <h3>基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="项目ID">{{ project.project_id }}</el-descriptions-item>
              <el-descriptions-item label="项目名称">{{ project.project_name }}</el-descriptions-item>
              <el-descriptions-item label="项目状态">
                <el-tag :type="getStatusType(project.status)">
                  {{ getStatusText(project.status) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="开始日期">{{ formatDate(project.start_date) }}</el-descriptions-item>
              <el-descriptions-item label="结束日期">{{ formatDate(project.end_date) }}</el-descriptions-item>
              <el-descriptions-item label="项目预算">¥{{ formatBudget(project.budget) }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>

      <!-- 项目描述 -->
      <div class="project-description" v-if="project.description">
        <h3>项目描述</h3>
        <el-card>
          <p style="white-space: pre-wrap;">{{ project.description }}</p>
        </el-card>
      </div>

      <!-- 项目进度 -->
      <div class="project-progress">
        <h3>项目进度</h3>
        <el-progress
          :percentage="project.progress || 0"
          :stroke-width="10"
          :status="getProgressStatus(project.progress)"
        >
          <template #default="{ percentage }">
            <span class="progress-text">{{ percentage }}%</span>
          </template>
        </el-progress>
        <div class="progress-info">
          <span>当前进度：{{ project.progress || 0 }}%</span>
          <span v-if="project.start_date && project.end_date">
            预计完成时间：{{ formatDate(project.end_date) }}
          </span>
        </div>
      </div>

      <!-- 项目成员 -->
      <div class="project-members">
        <h3>项目成员</h3>
        
        <!-- 有成员时显示表格和分页 -->
        <div v-if="members.length > 0 || loading">
          <el-table :data="members" style="width: 100%" v-loading="loading">
            <el-table-column prop="employee_id" label="员工ID" width="80" />
            <el-table-column prop="first_name" label="姓氏" />
            <el-table-column prop="last_name" label="名字" />
            <el-table-column label="角色">
              <template #default="scope">
                {{ scope.row.EmployeeProject ? scope.row.EmployeeProject.role : '未设置' }}
              </template>
            </el-table-column>
            <el-table-column label="参与时间">
              <template #default="scope">
                {{ scope.row.EmployeeProject ? formatDate(scope.row.EmployeeProject.start_date) : '' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="primary" link size="small" @click="viewEmployee(scope.row.employee_id)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.limit"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
        
        <!-- 无成员时显示空状态 -->
        <div v-else class="no-data">
          <el-empty description="该项目暂无成员" />
        </div>
      </div>

    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import projectApi from '../api/projectApi'

export default {
  name: 'ProjectDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const project = ref({})
    const members = ref([])
    const loading = ref(false)
    
    // 分页数据
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    })

    // 获取项目详情
    const fetchProjectDetail = async () => {
      try {
        loading.value = true
        const response = await projectApi.getProjectById(route.params.id)
        project.value = response.data
        // 获取项目成员列表
        await fetchProjectMembers()
      } catch (error) {
        ElMessage.error('获取项目详情失败')
        console.error('获取项目详情失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 获取项目成员列表
    const fetchProjectMembers = async () => {
      try {
        const response = await projectApi.getProjectMembers(route.params.id, {
          page: pagination.page,
          limit: pagination.limit
        })
        members.value = response.data
        pagination.total = response.pagination?.total || 0
      } catch (error) {
        ElMessage.error('获取项目成员列表失败')
        console.error('获取项目成员列表失败:', error)
      }
    }

    // 分页相关
    const handleSizeChange = (size) => {
      pagination.limit = size
      pagination.page = 1
      fetchProjectMembers()
    }

    const handleCurrentChange = (current) => {
      pagination.page = current
      fetchProjectMembers()
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 格式化预算
    const formatBudget = (budget) => {
      if (!budget) return '0.00'
      return budget.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
      return ''
    }

    // 查看员工详情
    const viewEmployee = (employeeId) => {
      // 跳转到员工详情页面
      router.push(`/employees/${employeeId}`)
    }

    onMounted(() => {
      fetchProjectDetail()
    })

    return {
      project,
      members,
      loading,
      pagination,
      formatDate,
      formatBudget,
      getStatusType,
      getStatusText,
      getProgressStatus,
      viewEmployee,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.project-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.basic-info {
  margin-bottom: 30px;
}

.basic-info h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.project-description {
  margin-bottom: 30px;
}

.project-description h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.project-progress {
  margin-bottom: 30px;
}

.project-progress h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.progress-info {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  color: #909399;
}

.progress-text {
  font-weight: bold;
}

.project-members {
  margin-bottom: 30px;
}

.project-members h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.project-stats {
  margin-top: 30px;
}

.project-stats h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.no-data {
  margin-top: 30px;
  text-align: center;
}
</style>