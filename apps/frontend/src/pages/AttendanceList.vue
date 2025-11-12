<template>
  <div class="attendance-list">
    <div class="page-header">
      <h2>考勤管理</h2>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <div class="filter-form">
        <el-form :model="filterForm" inline>
          <el-form-item label="员工姓名">
            <el-input
              v-model="filterForm.employeeName"
              placeholder="请输入员工姓名"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="filterForm.departmentId" placeholder="请选择部门" clearable>
              <el-option label="技术部" value="技术部" />
              <el-option label="市场部" value="市场部" />
              <el-option label="人事部" value="人事部" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker
              v-model="filterForm.date"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="考勤状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
              <el-option label="正常" value="normal" />
              <el-option label="迟到" value="late" />
              <el-option label="早退" value="early_leave" />
              <el-option label="缺勤" value="absent" />
              <el-option label="加班" value="overtime" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 考勤统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-statistic title="总员工数" :value="stats.total_employees" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="出勤率" :value="stats.attendance_rate" suffix="%" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="迟到人数" :value="stats.late_count" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="缺勤人数" :value="stats.absent_count" />
      </el-col>
    </el-row>

    <!-- 部门统计 -->
    <el-card class="department-stats-card">
      <template #header>
        <span>部门考勤统计</span>
      </template>
      <el-table :data="stats.department_stats" stripe>
        <el-table-column prop="department_name" label="部门名称" />
        <el-table-column prop="attendance_rate" label="出勤率">
          <template #default="{ row }">
            {{ row.attendance_rate }}%
          </template>
        </el-table-column>
        <el-table-column prop="late_count" label="迟到次数" />
        <el-table-column prop="early_leave_count" label="早退次数" />
        <el-table-column prop="absent_count" label="缺勤次数" />
      </el-table>
    </el-card>

    <!-- 考勤列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>考勤记录</span>
          <el-button type="primary" @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </template>

      <el-table
        :data="attendanceList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="attendance_id" label="ID" width="80" />
        <el-table-column prop="employee_name" label="员工姓名" width="120" />
        <el-table-column prop="department_name" label="部门" width="120" />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="check_in_time" label="上班时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.check_in_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="check_out_time" label="下班时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.check_out_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="work_hours" label="工作时长" width="100">
          <template #default="{ row }">
            {{ row.work_hours }}小时
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link @click="viewEmployeeDetail(row.employee_id)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import { attendanceAPI } from '../api/attendance'

export default {
  name: 'AttendanceList',
  components: {
    Refresh,
    Download
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const loading = ref(false)
    const attendanceList = ref([])
    
    const filterForm = reactive({
      employeeName: '',
      departmentId: '',
      date: '',
      dateRange: [],
      status: ''
    })
    
    const stats = reactive({
      total_employees: 0,
      attendance_rate: 0,
      late_count: 0,
      early_leave_count: 0,
      absent_count: 0,
      overtime_hours: 0,
      department_stats: []
    })
    
    const pagination = reactive({
      current: 1,
      size: 20,
      total: 0
    })

    // 方法
    const loadData = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.current,
          pageSize: pagination.size
        }
        
        // 添加筛选条件
        if (filterForm.employeeName) {
          params.employeeName = filterForm.employeeName
        }
        if (filterForm.departmentId) {
          params.departmentId = filterForm.departmentId
        }
        if (filterForm.date) {
          params.date = filterForm.date
        }
        if (filterForm.dateRange && filterForm.dateRange.length === 2) {
          params.startDate = filterForm.dateRange[0]
          params.endDate = filterForm.dateRange[1]
        }
        if (filterForm.status) {
          params.status = filterForm.status
        }
        
        const response = await attendanceAPI.getAttendanceList(params)
        if (response.success) {
          attendanceList.value = response.data || []
          pagination.total = response.total || 0
        }
      } catch (error) {
        ElMessage.error('加载考勤数据失败')
        console.error('加载考勤数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const loadStatistics = async () => {
      try {
        const response = await attendanceAPI.getStatistics()
        if (response.success) {
          Object.assign(stats, response.data)
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    }

    const handleSearch = () => {
      pagination.current = 1
      loadData()
    }

    const handleReset = () => {
      Object.assign(filterForm, {
        employeeName: '',
        departmentId: '',
        date: '',
        dateRange: [],
        status: ''
      })
      pagination.current = 1
      loadData()
    }

    const handleSizeChange = (size) => {
      pagination.size = size
      pagination.current = 1
      loadData()
    }

    const handleCurrentChange = (page) => {
      pagination.current = page
      loadData()
    }

    const viewEmployeeDetail = (employeeId) => {
      router.push(`/attendance/employee/${employeeId}`)
    }

    const exportData = () => {
      ElMessage.info('导出功能开发中...')
    }

    const refreshData = () => {
      loadData()
      loadStatistics()
    }

    const formatTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusType = (status) => {
      const typeMap = {
        'present': 'success',
        'late': 'warning',
        'early_leave': 'warning',
        'absent': 'danger',
        'sick_leave': 'info',
        'annual_leave': 'info'
      }
      return typeMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const textMap = {
        'present': '正常',
        'late': '迟到',
        'early_leave': '早退',
        'absent': '缺勤',
        'sick_leave': '病假',
        'annual_leave': '年假'
      }
      return textMap[status] || status
    }

    // 监听刷新事件
    const handleRefresh = () => {
      refreshData()
    }

    onMounted(() => {
      loadData()
      loadStatistics()
      window.addEventListener('refresh-attendance-data', handleRefresh)
    })

    onUnmounted(() => {
      window.removeEventListener('refresh-attendance-data', handleRefresh)
    })

    return {
      loading,
      attendanceList,
      filterForm,
      stats,
      pagination,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      viewEmployeeDetail,
      exportData,
      refreshData,
      formatTime,
      getStatusType,
      getStatusText
    }
  }
}
</script>

<style scoped>
.attendance-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  padding: 10px 0;
}

.stats-row {
  margin-bottom: 20px;
}

.department-stats-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>